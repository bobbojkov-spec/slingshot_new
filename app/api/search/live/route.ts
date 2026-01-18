import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        // Minimum 3 chars to search
        if (!q || q.length < 3) {
            return NextResponse.json({ products: [], collections: [], tags: [] });
        }

        const searchTerm = `%${q}%`;

        // 1. Search Products (limit 5)
        // Improve relevancy: match start of string first, then contains
        const productsSql = `
      SELECT name, slug, image 
      FROM products 
      WHERE (name ILIKE $1 OR sku ILIKE $1) AND status = 'active'
      ORDER BY 
        CASE WHEN name ILIKE $2 THEN 1 ELSE 2 END, 
        name ASC 
      LIMIT 5
    `;
        // $2 is just the query without %, to check "starts with" usually, 
        // but here let's simplify strict ordering for now.
        // Actually simpler: just ILIKE.

        const productsPromise = query(
            `SELECT name, slug, sku, image FROM products 
       WHERE (name ILIKE $1 OR sku ILIKE $1) AND status = 'active' 
       LIMIT 5`,
            [searchTerm]
        );

        // 2. Search Collections (limit 5)
        const collectionsPromise = query(
            `SELECT title, slug FROM collections 
       WHERE title ILIKE $1 AND hidden = false
       LIMIT 5`,
            [searchTerm]
        );

        // 3. Search Tags (limit 5)
        const tagsPromise = query(
            `SELECT name, slug FROM tags 
       WHERE name ILIKE $1 
       LIMIT 5`,
            [searchTerm]
        ).catch(err => {
            console.error('Tags search failed:', err);
            return { rows: [] };
        });

        const [productsRes, collectionsRes, tagsRes] = await Promise.all([
            productsPromise,
            collectionsPromise,
            tagsPromise
        ]);

        return NextResponse.json({
            products: productsRes.rows,
            collections: collectionsRes.rows,
            tags: tagsRes.rows
        });

    } catch (error) {
        console.error('Live search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
