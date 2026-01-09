import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function mockApi() {
    try {
        const lang = 'en';
        const params = {
            category: 'wake',
            activity: 'big-air', // This was the user's failing param
            limit: 12
        };

        console.log('--- Testing Query Construction ---');

        // START LOGIC FROM API
        const conditions = [`p.status = 'active'`, `c.visible = true`, `c.status = 'active'`, `pt.visible = true`, `pt.status = 'active'`];
        const sqlParams: any[] = [lang];
        let paramIndex = 2;

        if (params.category) {
            conditions.push(`c.slug = $${paramIndex}`);
            sqlParams.push(params.category);
            paramIndex++;
        }

        // Checking if we handle activity... we don't in current code.
        // If we simply ignore it, does it crash?
        // No.

        // Maybe the crash is because 'wake' category has NO products?
        // Script said 'Wake -> 93 products'.

        // Maybe the crash is in the Facets generation?

        const contextConditionsBase = [...conditions];
        // ... logic ...

        console.log('Running Main Query...');
        const whereClause = conditions.join(' AND ');

        const productsSql = `
      SELECT p.id, p.name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${whereClause}
      LIMIT 10
    `;

        await query(productsSql, sqlParams);
        console.log('✅ Main Query OK');

    } catch (err) {
        console.error('❌ CRASHED:', err);
    } finally {
        process.exit(0);
    }
}
mockApi();
