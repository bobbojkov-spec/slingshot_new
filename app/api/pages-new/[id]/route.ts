import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';

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
    'order',
    'seo_title',
    'seo_description',
    'seo_keywords',
    'title_bg',
    'subtitle_en',
    'subtitle_bg',
    'hero_image_url',
    'hero_video_url',
    'og_title',
    'og_description',
    'og_image_id',
    'canonical_url',
    'created_at',
    'updated_at',
];

const quoteColumn = (column: string) => (column === 'order' ? '"order"' : column);

async function resolveColumns() {
    const { rows } = await query(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pages' AND column_name = ANY($1)
    `,
        [PAGE_COLUMNS]
    );

    const available = new Set(rows.map((row: { column_name: string }) => row.column_name));
    const filtered = PAGE_COLUMNS.filter((column) => available.has(column));

    if (!filtered.length) {
        throw new Error('No page columns available');
    }

    return filtered;
}

const parseId = (id?: string) => {
    if (!id) {
        throw new Error('Missing id');
    }

    const numId = Number(id);

    if (Number.isNaN(numId) || numId <= 0) {
        throw new Error('Invalid id');
    }

    return numId;
};

const isPositiveInt = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) && Number.isInteger(numberValue) && numberValue >= 1;
};

const normalizeFooterColumn = (value: unknown): number | null => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const numberValue = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(numberValue)) {
        return null;
    }

    return numberValue;
};

const parseNullableNumber = (value: unknown): number | null => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const numberValue = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(numberValue)) {
        return null;
    }

    return numberValue;
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const numId = parseId(id);
        const columns = await resolveColumns();
        const selectColumns = columns.map(quoteColumn).join(', ');
        const { rows } = await query(
            `SELECT ${selectColumns} FROM pages WHERE id = $1`,
            [numId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Page not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: rows[0] });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: 'Failed to load page',
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const numId = parseId(id);
        const columns = await resolveColumns();
        const available = new Set(columns);
        const payload = await request.json();
        const updates: { column: string; value: unknown }[] = [];

        if (payload.title !== undefined && available.has('title')) {
            const title = typeof payload.title === 'string' ? payload.title.trim() : '';
            if (!title) {
                return NextResponse.json(
                    { ok: false, error: 'Title is required' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'title', value: title });
        }

        if (payload.slug !== undefined && available.has('slug')) {
            const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
            if (!slug) {
                return NextResponse.json(
                    { ok: false, error: 'Slug is required' },
                    { status: 400 }
                );
            }
            // Check if slug exists for another page
            const { rows: existingRows } = await query(
                'SELECT id FROM pages WHERE slug = $1 AND id != $2',
                [slug, numId]
            );
            if (existingRows.length > 0) {
                return NextResponse.json(
                    { ok: false, error: 'Slug already exists' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'slug', value: slug });
        }

        if (payload.status !== undefined && available.has('status')) {
            if (payload.status !== 'draft' && payload.status !== 'published') {
                return NextResponse.json(
                    { ok: false, error: 'Status must be draft or published' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'status', value: payload.status });
        }

        if (payload.show_header !== undefined && available.has('show_header')) {
            const showHeader = Boolean(payload.show_header);
            updates.push({ column: 'show_header', value: showHeader });

            if (showHeader) {
                if (!isPositiveInt(payload.header_order)) {
                    return NextResponse.json(
                        { ok: false, error: 'Header order must be an integer >= 1' },
                        { status: 400 }
                    );
                }
                if (available.has('header_order')) {
                    updates.push({ column: 'header_order', value: Number(payload.header_order) });
                }
            } else {
                if (available.has('header_order')) {
                    updates.push({ column: 'header_order', value: null });
                }
            }
        } else if (payload.header_order !== undefined && available.has('header_order')) {
            if (!isPositiveInt(payload.header_order)) {
                return NextResponse.json(
                    { ok: false, error: 'Header order must be an integer >= 1' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'header_order', value: Number(payload.header_order) });
        }

        if (payload.show_dropdown !== undefined && available.has('show_dropdown')) {
            const showDropdown = Boolean(payload.show_dropdown);
            updates.push({ column: 'show_dropdown', value: showDropdown });

            if (showDropdown) {
                if (!isPositiveInt(payload.dropdown_order)) {
                    return NextResponse.json(
                        { ok: false, error: 'Dropdown order must be an integer >= 1' },
                        { status: 400 }
                    );
                }
                if (available.has('dropdown_order')) {
                    updates.push({ column: 'dropdown_order', value: Number(payload.dropdown_order) });
                }
            } else {
                if (available.has('dropdown_order')) {
                    updates.push({ column: 'dropdown_order', value: null });
                }
            }
        } else if (payload.dropdown_order !== undefined && available.has('dropdown_order')) {
            if (!isPositiveInt(payload.dropdown_order)) {
                return NextResponse.json(
                    { ok: false, error: 'Dropdown order must be an integer >= 1' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'dropdown_order', value: Number(payload.dropdown_order) });
        }

        if (payload.footer_column !== undefined && available.has('footer_column')) {
            const normalized = normalizeFooterColumn(payload.footer_column);

            if (normalized !== null && ![1, 2, 3].includes(Number(normalized))) {
                return NextResponse.json(
                    { ok: false, error: 'Footer column must be 1, 2, 3, or empty' },
                    { status: 400 }
                );
            }

            updates.push({ column: 'footer_column', value: normalized });

            if (normalized === null) {
                if (available.has('footer_order')) {
                    updates.push({ column: 'footer_order', value: null });
                }
            } else {
                if (!isPositiveInt(payload.footer_order)) {
                    return NextResponse.json(
                        { ok: false, error: 'Footer order must be an integer >= 1' },
                        { status: 400 }
                    );
                }
                if (available.has('footer_order')) {
                    updates.push({ column: 'footer_order', value: Number(payload.footer_order) });
                }
            }
        } else if (payload.footer_order !== undefined && available.has('footer_order')) {
            if (!isPositiveInt(payload.footer_order)) {
                return NextResponse.json(
                    { ok: false, error: 'Footer order must be an integer >= 1' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'footer_order', value: Number(payload.footer_order) });
        }

        if (payload.seo_title !== undefined && available.has('seo_title')) {
            const seoTitle = typeof payload.seo_title === 'string' ? payload.seo_title.trim() : '';
            updates.push({ column: 'seo_title', value: seoTitle || null });
        }

        if (payload.seo_description !== undefined && available.has('seo_description')) {
            const seoDescription =
                typeof payload.seo_description === 'string' ? payload.seo_description.trim() : '';
            updates.push({ column: 'seo_description', value: seoDescription || null });
        }

        if (payload.seo_keywords !== undefined && available.has('seo_keywords')) {
            const seoKeywords =
                typeof payload.seo_keywords === 'string' ? payload.seo_keywords.trim() : '';
            updates.push({ column: 'seo_keywords', value: seoKeywords || null });
        }

        if (payload.og_title !== undefined && available.has('og_title')) {
            const ogTitle = typeof payload.og_title === 'string' ? payload.og_title.trim() : '';
            updates.push({ column: 'og_title', value: ogTitle || null });
        }

        if (payload.og_description !== undefined && available.has('og_description')) {
            const ogDescription =
                typeof payload.og_description === 'string' ? payload.og_description.trim() : '';
            updates.push({ column: 'og_description', value: ogDescription || null });
        }

        if (payload.og_image_id !== undefined && available.has('og_image_id')) {
            const imageId = parseNullableNumber(payload.og_image_id);
            updates.push({ column: 'og_image_id', value: imageId });
        }

        if (payload.canonical_url !== undefined && available.has('canonical_url')) {
            const canonicalValue =
                typeof payload.canonical_url === 'string' ? payload.canonical_url.trim() : '';
            updates.push({ column: 'canonical_url', value: canonicalValue || null });
        }

        if (payload.title_bg !== undefined && available.has('title_bg')) {
            updates.push({ column: 'title_bg', value: payload.title_bg || null });
        }

        if (payload.subtitle_en !== undefined && available.has('subtitle_en')) {
            updates.push({ column: 'subtitle_en', value: payload.subtitle_en || null });
        }

        if (payload.subtitle_bg !== undefined && available.has('subtitle_bg')) {
            updates.push({ column: 'subtitle_bg', value: payload.subtitle_bg || null });
        }

        if (payload.hero_image_url !== undefined && available.has('hero_image_url')) {
            updates.push({ column: 'hero_image_url', value: payload.hero_image_url || null });
        }

        if (payload.hero_video_url !== undefined && available.has('hero_video_url')) {
            updates.push({ column: 'hero_video_url', value: payload.hero_video_url || null });
        }

        if (payload.order !== undefined && available.has('order')) {
            if (!isPositiveInt(payload.order)) {
                return NextResponse.json(
                    { ok: false, error: 'Order must be an integer >= 1' },
                    { status: 400 }
                );
            }
            updates.push({ column: '"order"', value: Number(payload.order) });
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { ok: false, error: 'No updates provided' },
                { status: 400 }
            );
        }

        const setClause = updates
            .map((update, index) => `${update.column} = $${index + 1}`)
            .join(', ');
        const values = updates.map((update) => update.value);
        const placeholderIndex = values.length + 1;

        const returningColumns = columns.map(quoteColumn).join(', ');
        const { rows } = await query(
            `
      UPDATE pages
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${placeholderIndex}
      RETURNING ${returningColumns}
      `,
            [...values, numId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Page not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: rows[0] });
    } catch (error) {
        console.error('PAGES-NEW PATCH FAILED:', error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to update page',
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const numId = parseId(id);
        const { rows } = await query(
            `DELETE FROM pages WHERE id = $1 AND status = 'draft' RETURNING id`,
            [numId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Page not found or not deletable' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: { id: numId } });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: 'Failed to delete page',
            },
            { status: 500 }
        );
    }
}
