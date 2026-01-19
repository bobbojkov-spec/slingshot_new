import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const requestedLang = (searchParams.get('lang') || 'en').toLowerCase();
        const lang = requestedLang === 'bg' ? 'bg' : 'en';

        // Minimum 3 chars to search
        if (!q || q.length < 3) {
            return NextResponse.json({ products: [], collections: [], tags: [] });
        }

        const searchTerm = `%${q}%`;

        // 1. Search Products (limit 5)
        const productsPromise = query(
            `SELECT 
                p.id,
                COALESCE(pt_t.title, p.name) as name, 
                p.slug, 
                p.sku,
                (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id ORDER BY CASE size WHEN 'thumb' THEN 1 ELSE 2 END ASC LIMIT 1) as image_path
             FROM products p
             LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $2
             WHERE (p.name ILIKE $1 OR p.title ILIKE $1 OR p.sku ILIKE $1 OR p.handle ILIKE $1 OR pt_t.title ILIKE $1) AND p.status = 'active'
             ORDER BY p.name ASC
             LIMIT 20`,
            [searchTerm, lang]
        );

        // 2. Search Collections (limit 5) - UPDATED: Only show collections present in the Mega Menu
        const collectionsPromise = query(
            `SELECT DISTINCT
                COALESCE(ct.title, col.title) as title, 
                col.slug 
             FROM collections col
             JOIN menu_group_collections mgc ON col.id = mgc.collection_id
             LEFT JOIN collection_translations ct ON ct.collection_id = col.id AND ct.language_code = $2
             WHERE (col.title ILIKE $1 OR ct.title ILIKE $1) 
               AND col.visible = true
               AND EXISTS (SELECT 1 FROM collection_products cp WHERE cp.collection_id = col.id)
             LIMIT 5`,
            [searchTerm, lang]
        );

        // 3. Search Tags (limit 8) - Unnest from products matching query
        const tagsPromise = query(
            `SELECT DISTINCT t.tag as name, t.tag as slug
             FROM products p
             LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $2,
             LATERAL unnest(COALESCE(pt_t.tags, p.tags)) as t(tag)
             WHERE t.tag ILIKE $1
             LIMIT 8`,
            [searchTerm, lang]
        );

        const [productsRes, collectionsRes, tagsRes] = await Promise.all([
            productsPromise,
            collectionsPromise,
            tagsPromise
        ]);

        // Sign product images
        const products = await Promise.all(productsRes.rows.map(async (prod: any) => {
            let imageUrl = '/placeholder.jpg';
            if (prod.image_path) {
                try {
                    imageUrl = await getPresignedUrl(prod.image_path);
                } catch (e) {
                    console.error('Failed to sign live search image', e);
                }
            }
            return {
                name: prod.name,
                slug: prod.slug,
                sku: prod.sku,
                image: imageUrl
            };
        }));

        return NextResponse.json({
            products,
            collections: collectionsRes.rows,
            tags: tagsRes.rows
        });

    } catch (error) {
        console.error('Live search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
