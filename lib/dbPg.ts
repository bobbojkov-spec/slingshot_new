import { Pool, PoolClient } from 'pg';

const connectionString =
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('[DB_PG] WARNING: No DATABASE_URL found in environment variables.');
}

const pool = new Pool({
    connectionString,
    ssl: connectionString?.includes('railway') || connectionString?.includes('rlwy.net')
        ? { rejectUnauthorized: false }
        : undefined,
});

export async function query(sql: string, params: unknown[] = []) {
    const client = await pool.connect();

    try {
        return await client.query(sql, params);
    } finally {
        client.release();
    }
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>) {
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
