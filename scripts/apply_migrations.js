#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const url = process.env.SUPABASE_DB_URL || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_URL;
  if (!url) {
    console.error('SUPABASE_DB_URL (Postgres connection string) is required in env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('No migrations directory found at', migrationsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf8');
    console.log('Applying', file);
    try {
      await client.query(sql);
      console.log('Applied', file);
    } catch (err) {
      console.error('Error applying', file, err.message || err);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('All migrations applied');
}

main().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
