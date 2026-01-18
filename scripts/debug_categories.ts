import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log('Checking categories table...');
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT count(*) FROM categories');
        console.log('Count:', res.rows[0].count);

        const res2 = await client.query('SELECT * FROM categories LIMIT 5');
        console.log('Sample:', res2.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}
main();
