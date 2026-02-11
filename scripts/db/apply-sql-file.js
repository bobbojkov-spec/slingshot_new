#!/usr/bin/env node
/**
 * Apply a .sql file to DATABASE_URL.
 *
 * Usage:
 *   node scripts/db/apply-sql-file.js sql/admin_login_codes.sql
 *
 * Env:
 *   DATABASE_URL (required)
 *   DB_SSL=true  (optional; defaults to true for non-localhost URLs)
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { ensureEnv } = require('../../lib/env');

ensureEnv();


function inferSsl(connectionString) {
  if (!connectionString) return undefined;
  const isLocal = /localhost|127\.0\.0\.1/i.test(connectionString);
  if (process.env.DB_SSL) return process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
  return isLocal ? undefined : { rejectUnauthorized: false };
}

async function main() {
  const sqlPathArg = process.argv[2];
  if (!sqlPathArg) {
    console.error('Missing SQL file path arg.\nExample: node scripts/db/apply-sql-file.js sql/admin_login_codes.sql');
    process.exit(1);
  }

  const sqlPath = path.isAbsolute(sqlPathArg) ? sqlPathArg : path.join(process.cwd(), sqlPathArg);
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found: ${sqlPath}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL env var.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  if (!sql.trim()) {
    console.error(`SQL file is empty: ${sqlPath}`);
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: inferSsl(databaseUrl),
  });

  console.log(`Connecting...`);
  await client.connect();
  try {
    console.log(`Applying ${path.relative(process.cwd(), sqlPath)}...`);
    await client.query(sql);
    console.log('Done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err?.message || err);
  process.exit(1);
});


