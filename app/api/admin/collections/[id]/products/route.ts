import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { getPresignedUrl } from '@/lib/railway/storage';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/admin/collections/[id]/products - Get products in this collection
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const result = await query(
            `SELECT 
        p.id,
        p.name,
        p.slug,
        p.tags,
        p.brand,
        cp.sort_order,
        (
            SELECT storage_path 
            FROM product_images_railway 
            WHERE product_id = p.id AND size = 'thumb' 
            ORDER BY display_order ASC 
            LIMIT 1
        ) as storage_path
       FROM products p
       INNER JOIN collection_products cp ON cp.product_id = p.id
       WHERE cp.collection_id = $1
       ORDER BY cp.sort_order ASC, p.name ASC`,
            [id]
        );

        // Sign thumbnail URLs
        const productsWithSignedUrls = await Promise.all(result.rows.map(async (p: any) => ({
            ...p,
            thumbnail_url: p.storage_path ? await getPresignedUrl(p.storage_path) : null
        })));

        return NextResponse.json({
            products: productsWithSignedUrls
        });

    } catch (error: any) {
        console.error('Error fetching collection products:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch collection products' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/collections/[id]/products - Update products in collection
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const { productIds } = await request.json();

        // Start transaction
        await query('BEGIN');

        try {
            // Delete all existing products from collection
            await query(
                'DELETE FROM collection_products WHERE collection_id = $1',
                [id]
            );

            // Insert new products
            if (productIds && productIds.length > 0) {
                for (let i = 0; i < productIds.length; i++) {
                    await query(
                        `INSERT INTO collection_products (collection_id, product_id, sort_order)
             VALUES ($1, $2, $3)`,
                        [id, productIds[i], i]
                    );
                }
            }

            await query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Collection products updated successfully',
                count: productIds?.length || 0
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error: any) {
        console.error('Error updating collection products:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update collection products' },
            { status: 500 }
        );
    }
}
