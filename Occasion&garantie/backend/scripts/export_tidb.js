const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

async function exportData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'occasion_garantie',
    ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  });

  const outDir = path.join(__dirname, '..', 'tidb_export');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tables = ['categories', 'users', 'products', 'deposits'];

  for (const table of tables) {
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    const filePath = path.join(outDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
    console.log(`Exported ${rows.length} rows to ${filePath}`);
  }

  // Also export full SQL dump
  const dumpPath = path.join(outDir, 'full_dump.sql');
  const lines = [`-- TiDB Export: ${new Date().toISOString()}`, `-- Database: ${process.env.DB_NAME || 'occasion_garantie'}`, ''];

  for (const table of tables) {
    const [create] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
    lines.push(create[0]['Create Table'] + ';');
    lines.push('');

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      for (const row of rows) {
        const vals = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'number') return v;
          return `'${String(v).replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
        }).join(', ');
        lines.push(`INSERT INTO \`${table}\` (${columns}) VALUES (${vals});`);
      }
      lines.push('');
    }
  }

  fs.writeFileSync(dumpPath, lines.join('\n'));
  console.log(`SQL dump written to ${dumpPath}`);

  await conn.end();
}

exportData().catch(err => { console.error(err.message); process.exit(1); });
