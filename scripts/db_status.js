require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));

    const enums = await pool.query("SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname");
    console.log('Enums in DB:', enums.rows.map(r => r.typname));
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
