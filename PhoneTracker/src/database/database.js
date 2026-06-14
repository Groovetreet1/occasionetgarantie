import * as SQLite from "expo-sqlite";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

let db = null;

export function getDatabase() {
  if (!db) {
    db = SQLite.openDatabaseSync("phone_tracker.db");
    db.execSync(`
      CREATE TABLE IF NOT EXISTS phones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        purchasePrice REAL NOT NULL,
        salePrice REAL,
        soldAt TEXT,
        notes TEXT,
        photos TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    try { db.execSync("ALTER TABLE phones ADD COLUMN soldAt TEXT"); } catch (e) {}
    try { db.execSync("ALTER TABLE phones ADD COLUMN photos TEXT"); } catch (e) {}
  }
  return db;
}

export function addPhone(model, purchasePrice, notes, photos) {
  const database = getDatabase();
  const now = new Date().toISOString();
  const photoStr = photos && photos.length > 0 ? JSON.stringify(photos) : null;
  const result = database.runSync(
    "INSERT INTO phones (model, purchasePrice, notes, photos, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    [model, purchasePrice, notes || "", photoStr, now, now]
  );
  return result.lastInsertRowId;
}

export function getAllPhones() {
  const database = getDatabase();
  return database.getAllSync("SELECT * FROM phones ORDER BY createdAt DESC");
}

export function getPhoneById(id) {
  const database = getDatabase();
  return database.getFirstSync("SELECT * FROM phones WHERE id = ?", [id]);
}

export function updatePhone(id, model, purchasePrice, salePrice, notes, photos) {
  const database = getDatabase();
  const now = new Date().toISOString();
  const phone = getPhoneById(id);
  const isNewSale = salePrice != null && !phone.salePrice;
  const soldAt = isNewSale ? now : (salePrice == null ? null : phone.soldAt);
  const photoStr = photos ? JSON.stringify(photos) : (phone.photos || null);
  database.runSync(
    "UPDATE phones SET model = ?, purchasePrice = ?, salePrice = ?, soldAt = ?, notes = ?, photos = ?, updatedAt = ? WHERE id = ?",
    [model, purchasePrice, salePrice, soldAt, notes || "", photoStr, now, id]
  );
}

export function deletePhone(id) {
  const database = getDatabase();
  database.runSync("DELETE FROM phones WHERE id = ?", [id]);
}

export function getPhotosDir() {
  return new Directory(Paths.document, "phone_photos");
}

let photoCounter = 0;
export async function savePhoto(uri) {
  if (!uri) throw new Error("URI photo invalide");
  const photosDir = getPhotosDir();
  photosDir.create({ intermediates: true, idempotent: true });
  photoCounter++;
  const filename = `photo_${Date.now()}_${photoCounter}.jpg`;
  const src = new File(uri);
  const dest = new File(photosDir, filename);
  src.copy(dest);
  return dest.uri;
}

export async function exportToCSV() {
  const phones = getAllPhones();
  const stock = phones.filter((p) => !p.salePrice).reduce((s, p) => s + p.purchasePrice, 0);
  const profit = phones.filter((p) => p.salePrice).reduce((s, p) => s + (p.salePrice - p.purchasePrice), 0);
  const ventes = phones.filter((p) => p.salePrice).reduce((s, p) => s + p.salePrice, 0);
  const dateExport = new Date().toISOString().split("T")[0];

  const summary = [
    `"Récapitulatif au ${dateExport}"`,
    `En Stock,${stock.toFixed(2)} DHS`,
    `Profit Total,${profit >= 0 ? "+" : ""}${profit.toFixed(2)} DHS`,
    `Ventes Total,${ventes.toFixed(2)} DHS`,
    "",
  ].join("\n");

  const header = "ID,Modèle,Prix Achat,Prix Vente,Profit,Date Achat,Date Vente,Notes";
  const rows = phones.map((p) => {
    const pr = p.salePrice ? p.salePrice - p.purchasePrice : "";
    return `${p.id},"${(p.model || "").replace(/"/g, '""')}",${p.purchasePrice},${p.salePrice || ""},${pr},"${(p.createdAt || "").split("T")[0]}","${(p.soldAt || "").split("T")[0]}","${(p.notes || "").replace(/"/g, '""')}"`;
  });
  const csv = summary + [header, ...rows].join("\n");
  const filename = `phone_tracker_export_${dateExport}.csv`;

  const file = new File(Paths.cache, filename);
  file.create({ idempotent: true });
  file.write(csv);

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: "text/csv" });
      return null;
    }
  } catch (e) {
    // share failed, file already saved
  }
  return "Fichier sauvegardé: " + file.uri;
}

export async function exportToPDF() {
  const phones = getAllPhones();
  const stock = phones.filter((p) => !p.salePrice).reduce((s, p) => s + p.purchasePrice, 0);
  const profit = phones.filter((p) => p.salePrice).reduce((s, p) => s + (p.salePrice - p.purchasePrice), 0);
  const ventes = phones.filter((p) => p.salePrice).reduce((s, p) => s + p.salePrice, 0);
  const dateExport = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const rowsHtml = phones.map((p, i) => {
    const pr = p.salePrice ? p.salePrice - p.purchasePrice : null;
    const prClass = pr !== null ? (pr >= 0 ? "profit-pos" : "profit-neg") : "";
    const prText = pr !== null ? (pr >= 0 ? "+" : "") + pr.toFixed(2) : "—";
    return `<tr>
      <td>${phones.length - i}</td>
      <td>${p.model || ""}</td>
      <td>${p.purchasePrice.toFixed(2)}</td>
      <td>${p.salePrice ? p.salePrice.toFixed(2) : "—"}</td>
      <td class="${prClass}">${prText}</td>
      <td>${(p.createdAt || "").split("T")[0]}</td>
      <td>${(p.soldAt || "").split("T")[0] || "—"}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2d2d2d; }
  .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #6C63FF; margin-bottom: 20px; }
  .header h1 { font-size: 28px; color: #6C63FF; letter-spacing: 2px; }
  .header p { color: #888; font-size: 13px; margin-top: 4px; }
  .summary { display: flex; justify-content: space-between; margin-bottom: 24px; gap: 10px; }
  .summary-card { flex: 1; padding: 14px; border-radius: 10px; text-align: center; color: #fff; }
  .summary-card h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
  .summary-card .val { font-size: 22px; font-weight: bold; margin-top: 4px; }
  .card-stock { background: linear-gradient(135deg, #6C63FF, #8B83FF); }
  .card-profit { background: linear-gradient(135deg, #00C9A7, #00E5BF); }
  .card-ventes { background: linear-gradient(135deg, #FF6584, #FF8FA3); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #6C63FF; color: #fff; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody td { padding: 8px; border-bottom: 1px solid #eee; }
  tbody tr:nth-child(even) { background: #f8f8ff; }
  .profit-pos { color: #00C9A7; font-weight: bold; }
  .profit-neg { color: #FF6584; font-weight: bold; }
  .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #aaa; }
</style>
</head>
<body>
  <div class="header">
    <h1>Occasion&amp;garantie</h1>
    <p>Rapport d'inventaire et de ventes — ${dateExport}</p>
  </div>

  <div class="summary">
    <div class="summary-card card-stock">
      <h3>En stock</h3>
      <div class="val">${stock.toFixed(2)} DHS</div>
    </div>
    <div class="summary-card card-profit">
      <h3>Profit total</h3>
      <div class="val">${profit >= 0 ? "+" : ""}${profit.toFixed(2)} DHS</div>
    </div>
    <div class="summary-card card-ventes">
      <h3>Ventes total</h3>
      <div class="val">${ventes.toFixed(2)} DHS</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Modèle</th><th>Achat</th><th>Vente</th><th>Profit</th><th>Ajouté</th><th>Vendu</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    Occasion&amp;garantie — Document généré le ${dateExport}
  </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });
  const filename = `occasion_garantie_${new Date().toISOString().split("T")[0]}.pdf`;
  const dest = new File(Paths.document, filename);
  const tmp = new File(uri);
  tmp.copy(dest);

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest.uri, { mimeType: "application/pdf" });
      return null;
    }
  } catch (e) {
    // share failed, file already saved
  }
  return "PDF sauvegardé: " + dest.uri;
}
