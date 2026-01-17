
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createCollectionTranslations() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating collection_translations table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS collection_translations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
        language_code VARCHAR(10) NOT NULL,
        title TEXT,
        description TEXT,
        slug TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(collection_id, language_code)
      );
    `);

        console.log('Migrating existing collections to translations...');
        const collectionsRes = await client.query('SELECT * FROM collections');

        for (const col of collectionsRes.rows) {
            // English Translation (Source of Truth)
            await client.query(`
            INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
            VALUES ($1, 'en', $2, $3, $4)
            ON CONFLICT (collection_id, language_code) 
            DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;
        `, [col.id, col.title, col.description, col.handle]);

            // Bulgarian Translation (Copy of English)
            await client.query(`
            INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
            VALUES ($1, 'bg', $2, $3, $4)
            ON CONFLICT (collection_id, language_code) 
            DO NOTHING; -- Don't overwrite if exists
        `, [col.id, col.title, col.description, col.handle]);
        }

        await client.query('COMMIT');
        console.log(`Deep migration successful. Processed ${collectionsRes.rows.length} collections.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error migrating translations:', e);
    } finally {
        client.release();
        pool.end();
    }
}

createCollectionTranslations();
