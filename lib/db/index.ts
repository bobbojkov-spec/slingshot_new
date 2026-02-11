import { Pool } from 'pg';
import { ensureEnv } from '@/lib/env';

if (process.env.NODE_ENV !== 'production') {
  ensureEnv();
}

// Diagnostic logging for deployment debugging
const dbUrl = process.env.DATABASE_URL || '';
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');

const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');

if (!dbUrl) {
  console.error('CRITICAL: DATABASE_URL is not defined!');
}

// Create a connection pool
const pool = new Pool({
  connectionString: dbUrl,
  // Railway PostgreSQL requires SSL for external, but internal is faster/safer without
  // Crucially, internal .internal URLs often reject TLS handshakes.
  ssl: (dbUrl.includes('railway') || dbUrl.includes('rlwy.net') || process.env.NODE_ENV === 'production') && !dbUrl.includes('.internal')
    ? { rejectUnauthorized: false }
    : undefined,
  // Safety timeouts to prevent infinite hangs
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Limit connections during build
  max: process.env.NEXT_PHASE === 'phase-production-build' ? 2 : 10,
});

console.log('[DB DIAGNOSTICS] Pool initialized');

// Add pool error handling for debugging
pool.on('error', (err) => {
  console.error('[DB DIAGNOSTICS] Unexpected pool error:', err.message);
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { duration, rows: res.rowCount });
  return res;
}

// Helper for transactions
export async function transaction<T>(callback: (client: any) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper to get a client from the pool
export function getClient() {
  return pool.connect();
}

// Type-safe product queries
export const products = {
  async getAll() {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    return result.rows;
  },

  async getByHandle(handle: string) {
    const result = await query('SELECT * FROM products WHERE handle = $1', [handle]);
    return result.rows[0];
  },

  async getByCategory(category: string) {
    const result = await query('SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC', [category]);
    return result.rows;
  },

  async getActive() {
    const result = await query("SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC");
    return result.rows;
  },
};

export default pool;

