import { query } from "./lib/db/index.js";

async function diag() {
    try {
        const cats = await query("SELECT count(*) FROM categories WHERE parent_id IS NULL AND visible = true AND status = 'active'");
        console.log("Top Categories Count:", cats.rows[0].count);

        const hfc = await query("SELECT count(*) FROM homepage_featured_collections");
        console.log("Homepage Featured Collections Count:", hfc.rows[0].count);

        const featured = await query("SELECT count(*) FROM collection_products cp JOIN collections c ON c.id = cp.collection_id WHERE c.slug = 'featured-products'");
        console.log("Featured Products Count:", featured.rows[0].count);

        const best = await query("SELECT count(*) FROM collection_products cp JOIN collections c ON c.id = cp.collection_id WHERE c.slug = 'best-sellers'");
        console.log("Best Sellers Count:", best.rows[0].count);

        const slugs = await query("SELECT slug FROM collections WHERE visible = true LIMIT 5");
        console.log("Sample Collection Slugs:", slugs.rows.map(r => r.slug));

    } catch (e) {
        console.error(e);
    }
}
diag();
