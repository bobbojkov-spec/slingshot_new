
import { query } from '../lib/db';

async function main() {
    try {
        await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_video_url TEXT;`, []);
        console.log('Successfully added hero_video_url column');
    } catch (err) {
        console.error('Error adding column:', err);
    }
}

main();
