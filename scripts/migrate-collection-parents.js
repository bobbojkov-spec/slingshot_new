
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        // 1. Get Parent IDs
        const bagsRes = await pool.query("SELECT id FROM collections WHERE handle = 'bags'");
        if (bagsRes.rows.length === 0) {
            console.log("Parent 'bags' not found.");
            return;
        }
        const bagsId = bagsRes.rows[0].id;

        // 2. Assign Children
        const childrenHandles = ['solar-shield', 're_serve-bags']; // Day Protection, Wheeled

        for (const handle of childrenHandles) {
            const res = await pool.query("UPDATE collections SET parent_id = $1 WHERE handle = $2 RETURNING title", [bagsId, handle]);
            if (res.rows.length > 0) {
                console.log(`Updated ${res.rows[0].title} -> Parent: Bags`);
            } else {
                console.log(`Child '${handle}' not found.`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
