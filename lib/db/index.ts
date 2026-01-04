import { Pool } from 'pg';
import { ensureEnv } from '@/lib/env';

ensureEnv();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway PostgreSQL requires SSL
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('rlwy.net') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
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

