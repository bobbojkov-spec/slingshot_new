import { Pool, PoolClient } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    // Warn but don't crash in build time if possible, or maybe just throw if runtime.
    // We'll throw to be safe as per bridge implementation.
    // throw new Error('DATABASE_URL is not defined'); 
    // Actually, let's just log and throw to match bridge behavior but maybe be safer if env not loaded yet.
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
