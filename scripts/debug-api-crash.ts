import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function mockApiCrash() {
    try {
        const lang = 'en';
        const params = {
            category: 'foils',
            activity: 'big-air',
            limit: 12
        };

        console.log('--- Testing API Logic with Activity ---');

        // 1. Simulate Params
        const categorySlug = params.category;
        const tagNames: string[] = []; // searchParams.getAll('tag')
        if (params.activity) {
            tagNames.push(params.activity);
        }
        console.log('Tags:', tagNames);

        // 2. Build Query (Logic from route.ts)
        const conditions = [`p.status = 'active'`, `c.visible = true`, `c.status = 'active'`, `pt.visible = true`, `pt.status = 'active'`];
        const sqlParams: any[] = [lang];
        let paramIndex = 2;

        if (categorySlug) {
            conditions.push(`c.slug = $${paramIndex}`);
            sqlParams.push(categorySlug);
            paramIndex++;
        }

        if (tagNames.length > 0) {
            const placeholders = tagNames.map(() => `$${paramIndex++}`).join(', ');
            conditions.push(`p.tags && ARRAY[${placeholders}]::text[]`);
            sqlParams.push(...tagNames);
        }

        const whereClause = conditions.join(' AND ');
        console.log('WHERE:', whereClause);
        console.log('PARAMS:', sqlParams);

        // 3. Execute
        const productsSql = `
      SELECT p.id, p.name, p.tags
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${whereClause}
      LIMIT 10
    `;

        const res = await query(productsSql, sqlParams);
        console.log(`✅ Query returned ${res.rows.length} rows`);
        if (res.rows.length === 0) {
            console.log('⚠️  Zero results might be due to Case Mismatch (big-air vs Big Air)');
        }

    } catch (err) {
        console.error('❌ CRASHED:', err);
    } finally {
        process.exit(0);
    }
}
mockApiCrash();
