import { query } from "./lib/db/index";

async function diag() {
    try {
        const res = await query(`
            SELECT c.slug, c.*, 
                   (SELECT count(*) FROM collection_products cp 
                    JOIN products p ON cp.product_id = p.id 
                    WHERE cp.collection_id = c.id AND p.status = 'active') as active_count,
                   (SELECT count(*) FROM menu_group_collections mgc WHERE mgc.collection_id = c.id) as menu_count
            FROM collections c
            WHERE c.slug IN ('board-mounting-systems', 'ride-engine-impact-vests', 'web-specials-kite')
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}

diag();
