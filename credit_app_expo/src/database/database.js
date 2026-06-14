import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('mad_credits.db');
    await initDatabase();
  }
  return db;
}

async function initDatabase() {
  const database = db;
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      montant REAL NOT NULL,
      dateCreation INTEGER NOT NULL,
      dateEcheance INTEGER NOT NULL,
      estPaye INTEGER NOT NULL DEFAULT 0,
      dateRappel INTEGER
    )
  `);
}

// CRUD Operations
export async function insertCredit(credit) {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO credits (nom, prenom, montant, dateCreation, dateEcheance, estPaye, dateRappel)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      credit.nom,
      credit.prenom,
      credit.montant,
      credit.dateCreation || Date.now(),
      credit.dateEcheance,
      credit.estPaye ? 1 : 0,
      credit.dateRappel || null,
    ]
  );
  return result.lastInsertRowId;
}

export async function getAllCredits() {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    'SELECT * FROM credits ORDER BY dateEcheance ASC'
  );
  return rows.map(formatCredit);
}

export async function getEnCoursCredits() {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    'SELECT * FROM credits WHERE estPaye = 0 ORDER BY dateEcheance ASC'
  );
  return rows.map(formatCredit);
}

export async function getPayesCredits() {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    'SELECT * FROM credits WHERE estPaye = 1 ORDER BY dateEcheance DESC'
  );
  return rows.map(formatCredit);
}

export async function getCreditById(id) {
  const database = await getDatabase();
  const row = await database.getFirstAsync(
    'SELECT * FROM credits WHERE id = ?',
    [id]
  );
  return row ? formatCredit(row) : null;
}

export async function marquerPaye(id) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE credits SET estPaye = 1 WHERE id = ?',
    [id]
  );
}

export async function deleteCredit(id) {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM credits WHERE id = ?',
    [id]
  );
}

export async function getTotalEnCours() {
  const database = await getDatabase();
  const row = await database.getFirstAsync(
    'SELECT COALESCE(SUM(montant), 0) as total FROM credits WHERE estPaye = 0'
  );
  return row.total;
}

export async function getTotalPaye() {
  const database = await getDatabase();
  const row = await database.getFirstAsync(
    'SELECT COALESCE(SUM(montant), 0) as total FROM credits WHERE estPaye = 1'
  );
  return row.total;
}

export async function getStats() {
  const database = await getDatabase();
  const stats = await database.getFirstAsync(`
    SELECT
      COALESCE(SUM(CASE WHEN estPaye = 0 THEN montant ELSE 0 END), 0) as totalEnCours,
      COALESCE(SUM(CASE WHEN estPaye = 1 THEN montant ELSE 0 END), 0) as totalPaye,
      COALESCE(COUNT(CASE WHEN estPaye = 0 THEN 1 END), 0) as nbEnCours,
      COALESCE(COUNT(CASE WHEN estPaye = 1 THEN 1 END), 0) as nbPaye
    FROM credits
  `);
  return stats;
}

function formatCredit(row) {
  return {
    ...row,
    estPaye: row.estPaye === 1,
    nomComplet: `${row.prenom} ${row.nom}`,
    formattedMontant: `${row.montant.toFixed(2)} MAD`,
  };
}
