import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { revalidateTag } from 'next/cache';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/admin/menu-groups/[id]
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        // Fetch group details
        const groupRes = await query(
            'SELECT * FROM menu_groups WHERE id = $1',
            [id]
        );

        if (groupRes.rows.length === 0) {
            return NextResponse.json({ error: 'Menu Group not found' }, { status: 404 });
        }

        // Fetch associated collections
        const collectionsRes = await query(
            `SELECT 
                c.id, c.title, c.slug, c.source, mgc.sort_order
             FROM menu_group_collections mgc
             JOIN collections c ON mgc.collection_id = c.id
             WHERE mgc.menu_group_id = $1
             ORDER BY mgc.sort_order ASC`,
            [id]
        );

        return NextResponse.json({
            group: groupRes.rows[0],
            collections: collectionsRes.rows
        });
    } catch (error: any) {
        console.error('Error fetching menu group:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch menu group' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/menu-groups/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { title, sort_order, collectionIds } = body; // collectionIds is array of string

        // Start transaction
        await query('BEGIN');

        try {
            // Update group basic info
            await query(
                `UPDATE menu_groups 
                 SET title = $1, sort_order = $2, updated_at = NOW()
                 WHERE id = $3`,
                [title, sort_order || 0, id]
            );

            // Update collections if provided
            if (collectionIds) {
                // Remove existing
                await query('DELETE FROM menu_group_collections WHERE menu_group_id = $1', [id]);

                // Insert new (preserving order based on array index)
                for (let i = 0; i < collectionIds.length; i++) {
                    await query(
                        `INSERT INTO menu_group_collections (menu_group_id, collection_id, sort_order)
                         VALUES ($1, $2, $3)`,
                        [id, collectionIds[i], i]
                    );
                }
            }

            await query('COMMIT');

            // Revalidate navigation cache to reflect changes immediately
            revalidateTag('navigation');

            return NextResponse.json({ success: true });

        } catch (err) {
            await query('ROLLBACK');
            throw err;
        }

    } catch (error: any) {
        console.error('Error updating menu group:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update menu group' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/menu-groups/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        await query('DELETE FROM menu_groups WHERE id = $1', [id]);

        // Revalidate navigation cache to reflect changes immediately
        revalidateTag('navigation');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting menu group:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete menu group' },
            { status: 500 }
        );
    }
}
