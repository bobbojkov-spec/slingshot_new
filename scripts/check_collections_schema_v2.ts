import { query } from '../lib/db';

async function main() {
    try {
        const res = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'collections'
        `, []);
        console.table(res.rows);
        
        const constraints = await query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'collections'::regclass
        `, []);
        console.table(constraints.rows);
    } catch (e) {
        console.error(e);
    }
}

main();
