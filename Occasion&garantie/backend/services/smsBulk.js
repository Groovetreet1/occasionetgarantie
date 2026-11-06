// Envoi SMS en masse depuis un fichier Excel / CSV.
// Le principe : l'admin choisit la colonne "to" (telephone) et associe des
// variables ({{var1}}, {{nom}}, ...) aux colonnes du fichier. Chaque ligne
// produit un SMS personnalise, mis en file pour la passerelle Android.
const XLSX = require('xlsx');
const sms = require('./sms');
const smsGateway = require('./smsGateway');

const MAX_ROWS = parseInt(process.env.SMS_BULK_MAX || '300', 10);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEMPLATE_LEN = 1500;
const MAX_SMS_LEN = 900;
const MAX_PARSE_ROWS = 5000;
const PREVIEW_ROWS = 5;

function cleanCell(value) {
  if (value == null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

// Normalise un numero marocain (ou international) vers le format +E.164.
function toE164(value) {
  let s = cleanCell(value);
  if (!s) return null;
  s = s.replace(/\.0+$/, '');
  const digits = s.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00212')) s = '+' + digits.slice(2);
  else if (digits.startsWith('212') && digits.length === 12) s = '+' + digits;
  else if (digits.length === 10 && digits.startsWith('0') && /[67]/.test(digits[1])) s = '+212' + digits.slice(1);
  else if (digits.length === 9 && /^[67]/.test(digits)) s = '+212' + digits;
  else if (s.startsWith('+')) s = '+' + digits;
  else return null;
  return /^\+\d{8,15}$/.test(s) ? s : null;
}

function readWorkbook(buffer) {
  if (!buffer || !buffer.length) throw new Error('Fichier vide.');
  if (buffer.length > MAX_FILE_BYTES) throw new Error('Fichier trop volumineux (max 10 Mo).');
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer', raw: false, cellDates: false });
  } catch {
    throw new Error('Impossible de lire le fichier. Utilisez .xlsx, .xls ou .csv.');
  }
  const sheetName = wb.SheetNames && wb.SheetNames[0];
  if (!sheetName) throw new Error('Le fichier ne contient aucune feuille.');
  const matrix = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  });
  if (!matrix.length) throw new Error('La feuille est vide.');

  // En-tetes uniques (Excel peut avoir des doublons).
  const seen = new Map();
  const headers = (matrix[0] || []).map((h, i) => {
    let name = cleanCell(h) || `Colonne ${i + 1}`;
    const count = (seen.get(name) || 0) + 1;
    seen.set(name, count);
    if (count > 1) name = `${name} (${count})`;
    return name;
  });

  const rows = [];
  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i] || [];
    if (!line.some((v) => cleanCell(v) !== '')) continue;
    const row = { __row: i + 1 };
    headers.forEach((h, j) => {
      row[h] = cleanCell(line[j]);
    });
    rows.push(row);
    if (rows.length >= MAX_PARSE_ROWS) break;
  }
  if (!rows.length) throw new Error('Aucune ligne de donnees trouvee sous les en-tetes.');
  return { headers, rows, total: rows.length };
}

// Analyse pour l'ecran de mapping : colonnes, apercu, nombre de telephones
// valides par colonne (l'admin voit tout de suite la bonne colonne "to").
function parse(buffer) {
  const { headers, rows, total } = readWorkbook(buffer);
  const phoneCounts = {};
  for (const h of headers) {
    let count = 0;
    for (const row of rows) {
      if (toE164(row[h])) count += 1;
    }
    phoneCounts[h] = count;
  }
  const preview = rows.slice(0, PREVIEW_ROWS).map((row) => {
    const out = { __row: row.__row };
    for (const h of headers) out[h] = String(row[h] ?? '').slice(0, 160);
    return out;
  });
  return {
    headers,
    total,
    preview,
    phoneCounts,
    limit: MAX_ROWS,
  };
}

function templateKeys(template) {
  const keys = [];
  String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (m, key) => {
    if (!keys.includes(key)) keys.push(key);
    return m;
  });
  return keys;
}

function renderTemplate(template, row, variables) {
  const values = new Map(variables.map((v) => [v.key, cleanCell(row[v.column])]));
  return String(template)
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (m, key) => (values.has(key) ? values.get(key) : m))
    .trim();
}

function normalizeVariables(input) {
  if (!Array.isArray(input)) throw new Error('Variables invalides.');
  const out = [];
  const keys = new Set();
  for (const item of input) {
    const key = String(item && item.key ? item.key : '').trim();
    const column = String(item && item.column ? item.column : '').trim();
    if (!key && !column) continue;
    if (!/^[a-zA-Z0-9_]{1,30}$/.test(key)) {
      throw new Error(`Nom de variable invalide : "${key}". Utilisez lettres, chiffres et _ (max 30).`);
    }
    if (keys.has(key)) throw new Error(`Variable en double : "${key}".`);
    keys.add(key);
    out.push({ key, column });
  }
  return out;
}

async function sendBulk({ buffer, template, phoneColumn, variables, dedupe }) {
  if (!(await sms.isSmsEnabled())) {
    throw new Error('Les SMS sont desactives (interrupteur global).');
  }
  const text = String(template || '').trim();
  if (!text) throw new Error('Le message est vide.');
  if (text.length > MAX_TEMPLATE_LEN) {
    throw new Error(`Le modele est trop long (max ${MAX_TEMPLATE_LEN} caracteres).`);
  }
  const { headers, rows } = readWorkbook(buffer);
  const phoneCol = String(phoneColumn || '').trim();
  if (!phoneCol || !headers.includes(phoneCol)) {
    throw new Error('Colonne telephone introuvable dans le fichier.');
  }
  const vars = normalizeVariables(variables);
  for (const v of vars) {
    if (!v.column || !headers.includes(v.column)) {
      throw new Error(`La colonne "${v.column || v.key}" est introuvable dans le fichier.`);
    }
  }
  const usedKeys = new Set(vars.map((v) => v.key));
  const missing = templateKeys(text).filter((k) => !usedKeys.has(k));
  if (missing.length) {
    throw new Error(`Variables du message non definies : ${missing.map((k) => `{{${k}}}`).join(', ')}.`);
  }
  if (rows.length > MAX_ROWS) {
    throw new Error(`Trop de lignes (${rows.length}). Maximum ${MAX_ROWS} SMS par envoi : faites plusieurs lots.`);
  }

  const seenPhones = new Set();
  const stats = {
    total: rows.length,
    queued: 0,
    invalid: 0,
    duplicates: 0,
    empty: 0,
    tooLong: 0,
    failed: 0,
    limit: MAX_ROWS,
    errors: [],
  };

  for (const row of rows) {
    const phone = toE164(row[phoneCol]);
    if (!phone) {
      stats.invalid += 1;
      if (stats.errors.length < 8) stats.errors.push({ row: row.__row, reason: 'Numero invalide' });
      continue;
    }
    if (dedupe && seenPhones.has(phone)) {
      stats.duplicates += 1;
      continue;
    }
    const message = renderTemplate(text, row, vars);
    if (!message) {
      stats.empty += 1;
      if (stats.errors.length < 8) stats.errors.push({ row: row.__row, reason: 'Message vide' });
      continue;
    }
    if (message.length > MAX_SMS_LEN) {
      stats.tooLong += 1;
      if (stats.errors.length < 8) stats.errors.push({ row: row.__row, reason: 'Message trop long' });
      continue;
    }
    try {
      await smsGateway.enqueue(phone, sms.withBrand(message), 'bulk');
      seenPhones.add(phone);
      stats.queued += 1;
    } catch (e) {
      stats.failed += 1;
      if (stats.errors.length < 8) stats.errors.push({ row: row.__row, reason: e.message });
    }
  }

  return stats;
}

module.exports = {
  parse,
  sendBulk,
  toE164,
  renderTemplate,
  templateKeys,
  MAX_ROWS,
  MAX_FILE_BYTES,
};
