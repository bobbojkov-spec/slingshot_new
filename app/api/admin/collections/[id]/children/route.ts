import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { getPresignedUrl } from '@/lib/railway/storage';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/admin/collections/[id]/children - Get child collections in this meta-collection
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const result = await query(
            `SELECT 
                c.id,
                c.slug,
                c.image_url,
                cl.sort_order,
                COALESCE(ct.title, c.title) as title
             FROM collections c
             INNER JOIN collection_listings cl ON cl.child_id = c.id
             LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = 'en'
             WHERE cl.parent_id = $1
             ORDER BY cl.sort_order ASC, c.title ASC`,
            [id]
        );

        // Sign image URLs
        const collectionsWithSignedUrls = await Promise.all(result.rows.map(async (c: any) => {
            let signedUrl = null;
            if (c.image_url && !c.image_url.startsWith('http')) {
                try {
                    signedUrl = await getPresignedUrl(c.image_url);
                } catch (e) {
                    console.error('Failed to sign collection image', e);
                }
            }
            return {
                ...c,
                signed_image_url: signedUrl || c.image_url
            };
        }));

        return NextResponse.json({
            collections: collectionsWithSignedUrls
        });

    } catch (error: any) {
        console.error('Error fetching child collections:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch child collections' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/collections/[id]/children - Update child collections
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const { collectionIds } = await request.json();

        // Start transaction
        await query('BEGIN');

        try {
            // Delete all existing children from this parent
            await query(
                'DELETE FROM collection_listings WHERE parent_id = $1',
                [id]
            );

            // Insert new children
            if (collectionIds && collectionIds.length > 0) {
                for (let i = 0; i < collectionIds.length; i++) {
                    await query(
                        `INSERT INTO collection_listings (parent_id, child_id, sort_order)
                         VALUES ($1, $2, $3)`,
                        [id, collectionIds[i], i]
                    );
                }
            }

            await query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Child collections updated successfully',
                count: collectionIds?.length || 0
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error: any) {
        console.error('Error updating child collections:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update child collections' },
            { status: 500 }
        );
    }
}
