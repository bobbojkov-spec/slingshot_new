
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { image_url, video_url, visible, sort_order, translations, slug } = body;

        // check if slug/handle already exists
        if (slug) {
            const existing = await query(
                `SELECT id FROM collections WHERE (slug = $1 OR handle = $1) AND id != $2`,
                [slug, id]
            );
            if (existing.rows.length > 0) {
                return NextResponse.json(
                    { error: 'Slug/Handle already exists. Please choose another one.' },
                    { status: 400 }
                );
            }
        }

        // Update collection (sync handle with slug)
        // Using distinct parameters for slug and handle to avoid "inconsistent types deduced" error
        await query(
            `UPDATE collections 
             SET image_url = $1, video_url = $2, visible = $3, sort_order = $4, slug = $5, handle = $6
             WHERE id = $7`,
            [image_url, video_url, visible, sort_order, slug, slug, id]
        );

        // Update Translations (Upsert)
        // EN
        if (translations?.en) {
            await query(
                `INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
                 VALUES ($1, 'en', $2, $3)
                 ON CONFLICT (collection_id, language_code) 
                 DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle`,
                [id, translations.en.title, translations.en.subtitle]
            );
        }

        // BG
        if (translations?.bg) {
            await query(
                `INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
                 VALUES ($1, 'bg', $2, $3)
                 ON CONFLICT (collection_id, language_code) 
                 DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle`,
                [id, translations.bg.title, translations.bg.subtitle]
            );
        }

        // Revalidate navigation cache to reflect changes immediately
        revalidateTag('navigation', {});

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update collection error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update collection' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check product count
        const countRes = await query(
            'SELECT COUNT(*) as count FROM collection_products WHERE collection_id = $1',
            [id]
        );
        const count = parseInt(countRes.rows[0].count);

        if (count > 0) {
            return NextResponse.json(
                { error: 'Cannot delete collection with products. Remove products first.' },
                { status: 400 }
            );
        }

        // Check for child collections (collections that have this one as parent)
        const childRes = await query(
            'SELECT id, title FROM collections WHERE parent_id = $1',
            [id]
        );

        if (childRes.rows.length > 0) {
            return NextResponse.json(
                {
                    error: `Cannot delete collection because it has ${childRes.rows.length} child collection(s). Delete child collections first or remove their parent.`,
                    childCollections: childRes.rows
                },
                { status: 400 }
            );
        }

        // Delete
        await query('DELETE FROM collections WHERE id = $1', [id]);

        // Revalidate navigation cache to reflect changes immediately
        revalidateTag('navigation', {});

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete collection error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete collection' },
            { status: 500 }
        );
    }
}
