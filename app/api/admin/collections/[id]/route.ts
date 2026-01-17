import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/dbPg';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/admin/collections/[id] - Get single collection with translations
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const collectionResult = await query(
            `SELECT id, source, slug, handle, image_url, video_url, visible, sort_order, created_at, updated_at
       FROM collections
       WHERE id = $1`,
            [id]
        );

        if (collectionResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            );
        }

        const collection = collectionResult.rows[0];

        // Get translations
        const translationsResult = await query(
            `SELECT language_code, title, subtitle
       FROM collection_translations
       WHERE collection_id = $1`,
            [id]
        );

        const translations = translationsResult.rows.reduce((acc, row) => {
            acc[row.language_code] = {
                title: row.title,
                subtitle: row.subtitle
            };
            return acc;
        }, {} as Record<string, { title: string; subtitle: string | null }>);

        return NextResponse.json({
            collection,
            translations
        });

    } catch (error: any) {
        console.error('Error fetching collection:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch collection' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/collections/[id] - Update collection and translations
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const {
            image_url,
            video_url,
            visible,
            sort_order,
            translations
        } = body;

        await transaction(async (client) => {
            // Update collection
            await client.query(
                `UPDATE collections
         SET image_url = $1,
             video_url = $2,
             visible = $3,
             sort_order = $4,
             updated_at = NOW()
         WHERE id = $5`,
                [image_url, video_url, visible, sort_order, id]
            );

            // Update translations
            if (translations) {
                for (const [langCode, data] of Object.entries(translations)) {
                    const { title, subtitle } = data as { title: string; subtitle: string | null };

                    await client.query(
                        `INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (collection_id, language_code)
             DO UPDATE SET
               title = EXCLUDED.title,
               subtitle = EXCLUDED.subtitle,
               updated_at = NOW()`,
                        [id, langCode, title, subtitle]
                    );
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Collection updated successfully'
        });

    } catch (error: any) {
        console.error('Error updating collection:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update collection' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/collections/[id] - Delete collection (optional, for future use)
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        await query(
            'DELETE FROM collections WHERE id = $1',
            [id]
        );

        return NextResponse.json({
            success: true,
            message: 'Collection deleted successfully'
        });

    } catch (error: any) {
        console.error('Error deleting collection:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete collection' },
            { status: 500 }
        );
    }
}
