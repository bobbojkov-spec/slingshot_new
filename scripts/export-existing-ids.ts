import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { rows: products } = await pool.query('SELECT sku, title, handle FROM products');
        const { rows: variants } = await pool.query('SELECT sku FROM product_variants');

        const skus = new Set([
            ...products.map(p => p.sku).filter(Boolean),
            ...variants.map(v => v.sku).filter(Boolean)
        ]);

        const names = new Set(products.map(p => p.title.toLowerCase()));
        const handles = new Set(products.map(p => p.handle.toLowerCase()));

        const data = {
            skus: Array.from(skus),
            names: Array.from(names),
            handles: Array.from(handles)
        };

        const outPath = '/Users/borislavbojkov/dev/rideengine-eu-scrape/existing_data.json';
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

        console.log(`Exported ${skus.size} SKUs, ${names.size} names, and ${handles.size} handles to ${outPath}`);
    } catch (error) {
        console.error('Error fetching existing data:', error);
    } finally {
        await pool.end();
    }
}

main();
