require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log('Synchronizing product_colors schema...');

        // Add columns if they don't exist
        await client.query(`
            ALTER TABLE product_colors 
            ADD COLUMN IF NOT EXISTS name TEXT,
            ADD COLUMN IF NOT EXISTS image_path TEXT,
            ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
        `);

        // Sync data from old columns if they exist
        const { rows: columns } = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'product_colors'
        `);
        const columnNames = columns.map(c => c.column_name);

        if (columnNames.includes('position')) {
            console.log('Copying position to display_order...');
            await client.query('UPDATE product_colors SET display_order = position WHERE display_order = 0 OR display_order IS NULL');
        }

        if (columnNames.includes('name_en')) {
            console.log('Copying name_en to name...');
            await client.query('UPDATE product_colors SET name = name_en WHERE name IS NULL OR name = \'\'');
        }

        console.log('Schema synchronized successfully.');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
