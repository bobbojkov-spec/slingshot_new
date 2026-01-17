import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { getPresignedUrl } from '@/lib/railway/storage';

export const dynamic = 'force-dynamic';

function getUrl(path: string | null) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Just return the path, presigning can happen if needed but for icons maybe public URL is better?
    // For now let's minimal processing
    return path;
}

// GET /api/navigation/menu-structure?source=slingshot
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const source = searchParams.get('source');

        if (!source) {
            return NextResponse.json({ error: 'Source is required' }, { status: 400 });
        }

        // 1. Fetch Groups
        const groupsRes = await query(
            `SELECT id, title, title_bg, slug, sort_order 
             FROM menu_groups 
             WHERE source = $1 
             ORDER BY sort_order ASC`,
            [source]
        );
        const groups = groupsRes.rows;

        if (groups.length === 0) {
            return NextResponse.json({ groups: [] });
        }

        // 2. Fetch Collections for these groups
        // We also want to know which CATEGORIES these collections belong to.
        // Heuristic: A collection belongs to a category if it contains products in that category.
        const collectionsRes = await query(
            `
            WITH CollectionCategories AS (
                SELECT 
                    cp.collection_id,
                    array_agg(DISTINCT c_curr.slug) as category_slugs
                FROM collection_products cp
                JOIN products p ON cp.product_id = p.id
                JOIN categories c_curr ON p.category_id = c_curr.id
                GROUP BY cp.collection_id
            )
            SELECT 
                mgc.menu_group_id,
                c.id, 
                c.slug, 
                COALESCE(ct.title, c.title) as title,
                c.image_url,
                mgc.sort_order,
                cc.category_slugs
            FROM menu_group_collections mgc
            JOIN collections c ON mgc.collection_id = c.id
            LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'en'
            LEFT JOIN CollectionCategories cc ON c.id = cc.collection_id
            WHERE mgc.menu_group_id = ANY($1)
            ORDER BY mgc.sort_order ASC
            `,
            [groups.map((g: any) => g.id)]
        );

        // Map collections to groups
        const collectionsByGroupId = new Map();
        for (const row of collectionsRes.rows) {
            const groupId = row.menu_group_id;
            if (!collectionsByGroupId.has(groupId)) {
                collectionsByGroupId.set(groupId, []);
            }

            // Sign URL if needed
            let imageUrl = row.image_url;
            if (imageUrl && (!imageUrl.startsWith('http') || imageUrl.includes('slingshot-images-dev') || imageUrl.includes('slingshot-raw'))) {
                try {
                    const path = imageUrl.startsWith('http') ? new URL(imageUrl).pathname.substring(1) : imageUrl;
                    imageUrl = await getPresignedUrl(path);
                } catch (e) { console.error('Sign fail', e); }
            }

            collectionsByGroupId.get(groupId).push({
                id: row.id,
                title: row.title,
                slug: row.slug,
                image_url: imageUrl,
                category_slugs: row.category_slugs || []
            });
        }

        const result = groups.map((g: any) => ({
            id: g.id,
            title: g.title,
            title_bg: g.title_bg,
            slug: g.slug,
            collections: collectionsByGroupId.get(g.id) || []
        }));

        return NextResponse.json({ groups: result });

    } catch (error: any) {
        console.error('Error fetching menu structure:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch menu structure' },
            { status: 500 }
        );
    }
}
