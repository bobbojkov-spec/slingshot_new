import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { getPresignedUrl } from '@/lib/railway/storage';

// GET /api/admin/products/list - Get all products with thumbnails and tags
export async function GET(request: NextRequest) {
    try {
        const result = await query(
            `SELECT 
                p.id,
                p.name,
                p.slug,
                p.tags,
                p.brand,
                (
                    SELECT storage_path 
                    FROM product_images_railway 
                    WHERE product_id = p.id AND size = 'thumb' 
                    ORDER BY display_order ASC 
                    LIMIT 1
                ) as storage_path
            FROM products p
            ORDER BY p.name ASC`
        );

        // Sign URLs
        const productsWithSignedUrls = await Promise.all(result.rows.map(async (p: any) => ({
            ...p,
            thumbnail_url: p.storage_path ? await getPresignedUrl(p.storage_path) : null
        })));

        return NextResponse.json({
            products: productsWithSignedUrls
        });

    } catch (error: any) {
        console.error('Error listing products:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list products' },
            { status: 500 }
        );
    }
}
