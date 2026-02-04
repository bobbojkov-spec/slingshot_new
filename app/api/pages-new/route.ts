import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const PAGE_COLUMNS = [
    'id',
    'title',
    'slug',
    'status',
    'show_header',
    'header_order',
    'show_dropdown',
    'dropdown_order',
    'footer_column',
    'footer_order',
    '"order"',
    'seo_title',
    'seo_description',
    'seo_keywords',
    'og_title',
    'og_description',
    'og_image_id',
    'canonical_url',
    'created_at',
    'updated_at',
];

export async function GET() {
    try {
        const selectColumns = PAGE_COLUMNS.join(', ');
        const { rows } = await query(
            `SELECT ${selectColumns} FROM pages ORDER BY "order" ASC NULLS LAST, created_at DESC`
        );

        return NextResponse.json({
            ok: true,
            data: rows,
        });
    } catch (error) {
        console.error('PAGES GET FAILED:', error);

        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to load pages',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
        const slug = typeof payload?.slug === 'string' ? payload.slug.trim() : '';

        if (!title) {
            return NextResponse.json(
                { ok: false, error: 'Title is required' },
                { status: 400 }
            );
        }

        if (!slug) {
            return NextResponse.json(
                { ok: false, error: 'Slug is required' },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const { rows: existingRows } = await query(
            'SELECT id FROM pages WHERE slug = $1',
            [slug]
        );

        if (existingRows.length > 0) {
            return NextResponse.json(
                { ok: false, error: 'Slug already exists' },
                { status: 400 }
            );
        }

        // Get next order value
        const { rows: orderRows } = await query(
            'SELECT COALESCE(MAX("order"), 0) AS max_order FROM pages'
        );
        const nextOrderValue = Number(orderRows[0]?.max_order ?? 0) + 1;

        const { rows } = await query(
            `
      INSERT INTO pages (title, slug, "order")
      VALUES ($1, $2, $3)
      RETURNING ${PAGE_COLUMNS.join(', ')}
    `,
            [title, slug, nextOrderValue]
        );

        return NextResponse.json({
            ok: true,
            data: rows[0],
        });
    } catch (error) {
        console.error('PAGES POST FAILED:', error);

        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to create page',
            },
            { status: 500 }
        );
    }
}
