// Rapport PDF brande Occasion & Garantie : synthese + historique SMS / emails.
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const BRAND = 'Occasion & Garantie';
const AMBER = '#f59e0b';
const AMBER_DARK = '#d97706';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const GREEN = '#059669';
const RED = '#dc2626';
const BLUE = '#2563eb';
const TZ = 'Africa/Casablanca';

// PDFKit (polices standard) ne gere que le jeu WinAnsi : on neutralise le reste
// pour eviter une exception sur les caracteres arabes / emoji.
function safe(value) {
  return String(value == null ? '' : value).replace(
    /[^\u0000-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018\u2019\u201a\u201c\u201d\u201e\u2020\u2021\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]/g,
    '?'
  );
}

function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ });
}

function fmtDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ })} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })}`;
}

function fitText(doc, value, width, font, size) {
  doc.font(font).fontSize(size);
  let text = safe(value);
  if (doc.widthOfString(text) <= width) return text;
  while (text.length > 4 && doc.widthOfString(`${text}...`) > width) {
    text = text.slice(0, -1);
  }
  return `${text}...`;
}

const STATUS = {
  sent: { label: 'Envoyé', color: GREEN },
  failed: { label: 'Échoué', color: RED },
  pending: { label: 'En attente', color: AMBER_DARK },
  sending: { label: 'En cours', color: BLUE },
};

const COLUMNS = [
  { key: 'date', label: 'Date', x: 40, width: 95 },
  { key: 'type', label: 'Type', x: 135, width: 42 },
  { key: 'recipient', label: 'Destinataire', x: 177, width: 128 },
  { key: 'content', label: 'Objet / Message', x: 305, width: 188 },
  { key: 'status', label: 'Statut', x: 493, width: 62 },
];

function drawTableHeader(doc, y) {
  doc.rect(40, y, 515, 20).fill(INK);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  for (const col of COLUMNS) {
    doc.text(col.label, col.x + 5, y + 6, { width: col.width - 10, lineBreak: false });
  }
  return y + 20;
}

function drawRow(doc, y, entry, index) {
  if (index % 2 === 1) {
    doc.rect(40, y, 515, 21).fill('#f8fafc');
  }
  const status = STATUS[entry.status] || STATUS.pending;
  const date = fitText(doc, fmtDateTime(entry.sent_at || entry.created_at), COLUMNS[0].width - 10, 'Helvetica', 7.4);
  doc.fillColor('#334155').font('Helvetica').fontSize(7.4).text(date, COLUMNS[0].x + 5, y + 7, { lineBreak: false });
  doc.fillColor(entry.type === 'email' ? BLUE : AMBER_DARK).font('Helvetica-Bold').fontSize(7.4)
    .text(entry.type === 'email' ? 'Email' : 'SMS', COLUMNS[1].x + 5, y + 7, { lineBreak: false });
  doc.fillColor('#334155').font('Helvetica').fontSize(7.4)
    .text(fitText(doc, entry.recipient, COLUMNS[2].width - 10, 'Helvetica', 7.4), COLUMNS[2].x + 5, y + 7, { lineBreak: false });
  doc.fillColor('#475569').font('Helvetica').fontSize(7.4)
    .text(fitText(doc, entry.content, COLUMNS[3].width - 10, 'Helvetica', 7.4), COLUMNS[3].x + 5, y + 7, { lineBreak: false });
  doc.fillColor(status.color).font('Helvetica-Bold').fontSize(7.4)
    .text(status.label, COLUMNS[4].x + 5, y + 7, { lineBreak: false });
  return y + 21;
}

function buildReport({ summary, entries = [], days = 30, generatedAt = new Date() }) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
    info: {
      Title: `Rapport SMS & Emails - ${BRAND}`,
      Author: BRAND,
      Subject: 'Historique des envois SMS et emails',
      Creator: BRAND,
    },
  });

  const W = doc.page.width;
  const M = 40;
  const CW = W - M * 2;

  // ---- En-tete ----
  doc.rect(0, 0, W, 96).fill(INK);
  doc.rect(0, 96, W, 4).fill(AMBER);

  let logoDrawn = false;
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  try {
    if (fs.existsSync(logoPath)) {
      doc.roundedRect(M, 22, 52, 52, 10).fill('#ffffff');
      doc.image(logoPath, M + 8, 30, { fit: [36, 36] });
      logoDrawn = true;
    }
  } catch {
    logoDrawn = false;
  }

  const titleX = logoDrawn ? M + 66 : M;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(19).text(BRAND, titleX, 26);
  doc.fillColor('#fcd34d').font('Helvetica-Bold').fontSize(8.5)
    .text("RAPPORT D'ACTIVITÉ - SMS & EMAILS", titleX, 52, { characterSpacing: 1.1 });
  doc.fillColor('#cbd5e1').font('Helvetica').fontSize(8.5)
    .text(`Période : ${days} derniers jours`, titleX, 68);

  doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
    .text('GÉNÉRÉ LE', M, 28, { width: CW, align: 'right', characterSpacing: 1 });
  doc.fillColor('#e2e8f0').font('Helvetica-Bold').fontSize(9.5)
    .text(fmtDateTime(generatedAt), M, 40, { width: CW, align: 'right' });
  doc.fillColor('#fbbf24').font('Helvetica').fontSize(8)
    .text('www.occasionetgarantie.store', M, 66, { width: CW, align: 'right' });

  // ---- Synthese ----
  let y = 122;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(14).text('Synthèse des envois', M, y);
  const from = new Date(generatedAt.getTime() - days * 86400000);
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(`Du ${fmtDate(from)} au ${fmtDate(generatedAt)} - SMS et emails sortants.`, M, y + 20, { width: CW });
  y += 44;

  const gap = 10;
  const cardW = (CW - gap * 3) / 4;
  const cards = [
    { label: 'SMS envoyés', value: summary?.sms?.sent || 0, color: GREEN, bg: '#ecfdf5' },
    { label: 'SMS échoués', value: summary?.sms?.failed || 0, color: RED, bg: '#fef2f2' },
    { label: 'Emails envoyés', value: summary?.email?.sent || 0, color: BLUE, bg: '#eff6ff' },
    { label: 'Emails échoués', value: summary?.email?.failed || 0, color: RED, bg: '#fef2f2' },
  ];
  cards.forEach((card, i) => {
    const x = M + i * (cardW + gap);
    doc.roundedRect(x, y, cardW, 62, 8).fill(card.bg);
    doc.fillColor(card.color).font('Helvetica-Bold').fontSize(21)
      .text(String(card.value), x + 10, y + 8, { width: cardW - 20 });
    doc.fillColor('#475569').font('Helvetica').fontSize(8)
      .text(card.label, x + 10, y + 38, { width: cardW - 20 });
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
      .text('sur la période', x + 10, y + 49, { width: cardW - 20 });
  });
  y += 76;

  const all = summary?.allTime || {};
  doc.roundedRect(M, y, CW, 26, 6).fill('#f8fafc');
  doc.fillColor('#475569').font('Helvetica').fontSize(8.5)
    .text(
      `Depuis le lancement : ${all.smsSent || 0} SMS envoyés (${all.smsFailed || 0} échoués) - ${all.emailSent || 0} emails envoyés (${all.emailFailed || 0} échoués).`,
      M + 10, y + 9, { width: CW - 20 }
    );
  y += 44;

  // ---- Tableau ----
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12.5).text('Détail des envois', M, y);
  y += 20;

  if (!entries.length) {
    doc.roundedRect(M, y, CW, 46, 6).fill('#f8fafc');
    doc.fillColor(MUTED).font('Helvetica').fontSize(9.5)
      .text('Aucun envoi sur cette période.', M, y + 17, { width: CW, align: 'center' });
  } else {
    y = drawTableHeader(doc, y);
    const limitY = doc.page.height - 70;
    entries.forEach((entry, i) => {
      if (y + 21 > limitY) {
        doc.addPage();
        y = 50;
        y = drawTableHeader(doc, y);
      }
      y = drawRow(doc, y, entry, i);
    });
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
      .text(`${entries.length} envoi(s) affiché(s).`, M, y + 8, { width: CW, align: 'right' });
  }

  // ---- Pied de page sur chaque page ----
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const bottom = doc.page.height - 30;
    doc.page.margins.bottom = 0;
    doc.moveTo(M, bottom - 12).lineTo(W - M, bottom - 12).strokeColor(LINE).lineWidth(0.7).stroke();
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
      .text(`${BRAND} - www.occasionetgarantie.store - contact@contact.occasionetgarantie.store`, M, bottom - 4, {
        width: CW,
        align: 'left',
        lineBreak: false,
      });
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
      .text(`Page ${i + 1} / ${range.count}`, M, bottom - 4, { width: CW, align: 'right', lineBreak: false });
  }

  return doc;
}

module.exports = { buildReport };
