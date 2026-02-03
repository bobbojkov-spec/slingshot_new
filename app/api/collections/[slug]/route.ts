import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';

export const runtime = 'nodejs';

// GET - Fetch collection by slug with its products
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';

        // Fetch collection details
        const collectionResult = await query(
            `SELECT 
        c.id,
        c.slug,
        c.title as title_en,
        c.subtitle as subtitle_en,
        c.image_url,
        c.source,
        ct.title as title_translated,
        ct.subtitle as subtitle_translated
      FROM collections c
      LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = $2
      WHERE c.slug = $1 AND c.visible = true`,
            [slug, lang]
        );

        if (collectionResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            );
        }

        const collection = collectionResult.rows[0];

        // Fetch products in this collection
        const productsResult = await query(
            `SELECT
        p.id,
        p.name as name_en,
        p.slug,
        p.sku,
        p.tags,
        p.status,
        pt.title as name_translated,
        pt.tags as tags_translated,
        (SELECT price FROM product_variants WHERE product_id = p.id ORDER BY position ASC LIMIT 1) as price,
        (SELECT compare_at_price FROM product_variants WHERE product_id = p.id ORDER BY position ASC LIMIT 1) as original_price,
        (
          SELECT storage_path
          FROM product_images_railway
          WHERE product_id = p.id
          ORDER BY
            CASE size
              WHEN 'small' THEN 1
              WHEN 'thumb' THEN 2
              ELSE 3
            END ASC,
            display_order ASC
          LIMIT 1
        ) as image_path,
        c.name as category,
        c.slug as category_slug
      FROM collection_products cp
      JOIN products p ON p.id = cp.product_id
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.language_code = $2
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE cp.collection_id = $1 AND p.status = 'active'
      ORDER BY cp.sort_order ASC, p.name ASC`,
            [collection.id, lang]
        );

        // Sign image URLs and format products
        const products = await Promise.all(
            productsResult.rows.map(async (row) => {
                let imageUrl = null;
                if (row.image_path) {
                    try {
                        imageUrl = await getPresignedUrl(row.image_path);
                    } catch (e) {
                        imageUrl = null;
                    }
                }

                return {
                    id: row.id,
                    name: row.name_translated || row.name_en,
                    slug: row.slug,
                    sku: row.sku,
                    price: row.price || 0,
                    originalPrice: row.original_price || row.compare_price || null,
                    image: imageUrl,
                    image_path: row.image_path,
                    category: row.category || 'Product',
                    categorySlug: row.category_slug,
                    tags: row.tags || [],
                };
            })
        );

        // Sign collection image
        let collectionImageUrl = null;
        if (collection.image_url) {
            try {
                const imagePath = collection.image_url.replace('/thumb/', '/middle/').replace('/full/', '/middle/');
                collectionImageUrl = await getPresignedUrl(imagePath);
            } catch (e) {
                collectionImageUrl = collection.image_url;
            }
        }

        return NextResponse.json({
            collection: {
                id: collection.id,
                slug: collection.slug,
                title: collection.title_translated || collection.title_en,
                subtitle: collection.subtitle_translated || collection.subtitle_en,
                image_url: collectionImageUrl,
                source: collection.source,
            },
            products,
        });
    } catch (error: any) {
        console.error('Error fetching collection:', error);
        return NextResponse.json(
            { error: 'Failed to fetch collection', details: error?.message },
            { status: 500 }
        );
    }
}
