import { Pool } from 'pg';
import { ensureEnv } from '@/lib/env';

if (process.env.NODE_ENV !== 'production') {
  ensureEnv();
}

const dbUrl = process.env.DATABASE_URL || '';

// Singleton pattern for the database pool
declare global {
  var _pgPool: Pool | undefined;
}

if (!dbUrl) {
  console.error('CRITICAL: DATABASE_URL is not defined!');
}

// Create or reuse pool
const pool = globalThis._pgPool || new Pool({
  connectionString: dbUrl,
  // Railway standard: Disable SSL for internal (.internal) hosts, enable for others in production
  ssl: (process.env.NODE_ENV === 'production' && !dbUrl.includes('.internal'))
    ? { rejectUnauthorized: false }
    : undefined,
  // Safety timeouts to prevent infinite hangs
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  // Limit connections during build
  max: process.env.NEXT_PHASE === 'phase-production-build' ? 2 : 10,
});

if (!globalThis._pgPool) {
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
  console.log('[DB] Pool initialized (Singleton created) for:', maskedUrl);
  globalThis._pgPool = pool;
}

// Add pool error handling
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
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
