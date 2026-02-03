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
        const selectColumns = PAGE_COLUMNS.join(', ');
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
        const payload = await request.json();
        const updates: { column: string; value: unknown }[] = [];

        if (payload.title !== undefined) {
            const title = typeof payload.title === 'string' ? payload.title.trim() : '';
            if (!title) {
                return NextResponse.json(
                    { ok: false, error: 'Title is required' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'title', value: title });
        }

        if (payload.slug !== undefined) {
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

        if (payload.status !== undefined) {
            if (payload.status !== 'draft' && payload.status !== 'published') {
                return NextResponse.json(
                    { ok: false, error: 'Status must be draft or published' },
                    { status: 400 }
                );
            }
            updates.push({ column: 'status', value: payload.status });
        }

        if (payload.show_header !== undefined) {
            const showHeader = Boolean(payload.show_header);
            updates.push({ column: 'show_header', value: showHeader });

            if (showHeader) {
                if (!isPositiveInt(payload.header_order)) {
                    return NextResponse.json(
                        { ok: false, error: 'Header order must be an integer >= 1' },
                        { status: 400 }
                    );
                }
                updates.push({ column: 'header_order', value: Number(payload.header_order) });
            } else {
                updates.push({ column: 'header_order', value: null });
            }
        }

        if (payload.show_dropdown !== undefined) {
            const showDropdown = Boolean(payload.show_dropdown);
            updates.push({ column: 'show_dropdown', value: showDropdown });

            if (showDropdown) {
                if (!isPositiveInt(payload.dropdown_order)) {
                    return NextResponse.json(
                        { ok: false, error: 'Dropdown order must be an integer >= 1' },
                        { status: 400 }
                    );
                }
                updates.push({ column: 'dropdown_order', value: Number(payload.dropdown_order) });
            } else {
                updates.push({ column: 'dropdown_order', value: null });
            }
        }

        if (payload.footer_column !== undefined) {
            const footerColumn = parseNullableNumber(payload.footer_column);

            if (footerColumn !== null && ![1, 2, 3].includes(Number(footerColumn))) {
                return NextResponse.json(
                    { ok: false, error: 'Footer column must be 1, 2, 3, or empty' },
                    { status: 400 }
                );
            }

            updates.push({ column: 'footer_column', value: footerColumn });

            if (footerColumn === null) {
                updates.push({ column: 'footer_order', value: null });
            } else {
                if (!isPositiveInt(payload.footer_order)) {
                    return NextResponse.json(
                        { ok: false, error: 'Footer order must be an integer >= 1' },
                        { status: 400 }
                    );
                }
                updates.push({ column: 'footer_order', value: Number(payload.footer_order) });
            }
        }

        if (payload.seo_title !== undefined) {
            const seoTitle = typeof payload.seo_title === 'string' ? payload.seo_title.trim() : '';
            updates.push({ column: 'seo_title', value: seoTitle || null });
        }

        if (payload.seo_description !== undefined) {
            const seoDescription =
                typeof payload.seo_description === 'string' ? payload.seo_description.trim() : '';
            updates.push({ column: 'seo_description', value: seoDescription || null });
        }

        if (payload.seo_keywords !== undefined) {
            const seoKeywords =
                typeof payload.seo_keywords === 'string' ? payload.seo_keywords.trim() : '';
            updates.push({ column: 'seo_keywords', value: seoKeywords || null });
        }

        if (payload.og_title !== undefined) {
            const ogTitle = typeof payload.og_title === 'string' ? payload.og_title.trim() : '';
            updates.push({ column: 'og_title', value: ogTitle || null });
        }

        if (payload.og_description !== undefined) {
            const ogDescription =
                typeof payload.og_description === 'string' ? payload.og_description.trim() : '';
            updates.push({ column: 'og_description', value: ogDescription || null });
        }

        if (payload.og_image_id !== undefined) {
            const imageId = parseNullableNumber(payload.og_image_id);
            updates.push({ column: 'og_image_id', value: imageId });
        }

        if (payload.canonical_url !== undefined) {
            const canonicalValue =
                typeof payload.canonical_url === 'string' ? payload.canonical_url.trim() : '';
            updates.push({ column: 'canonical_url', value: canonicalValue || null });
        }

        if (payload.order !== undefined) {
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

        const { rows } = await query(
            `
      UPDATE pages
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${placeholderIndex}
      RETURNING ${PAGE_COLUMNS.join(', ')}
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
        console.error('PAGES PATCH FAILED:', error);
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
                { ok: false, error: 'Page not found or not deletable (only draft pages can be deleted)' },
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
