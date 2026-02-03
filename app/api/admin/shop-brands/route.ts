import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getKeyFromUrl, getPresignedUrl } from '@/lib/railway/storage';

export const runtime = 'nodejs';

const getBucketAndKey = (url: string) => {
    try {
        const parsed = new URL(url);
        const [bucket, ...rest] = parsed.pathname.replace(/^\//, '').split('/');
        return {
            bucket: bucket || undefined,
            key: rest.join('/') || getKeyFromUrl(url) || url,
        };
    } catch (error) {
        return { bucket: undefined, key: getKeyFromUrl(url) || url };
    }
};

// GET - Fetch featured shop brands
export async function GET() {
    try {
        const result = await query(`
      SELECT id, name, slug, logo_url, sort_order
      FROM shop_featured_brands
      ORDER BY sort_order ASC, name ASC
    `);

        const brands = await Promise.all(
            result.rows.map(async (row: any) => {
                if (!row.logo_url) return { ...row, logo_url_signed: null };
                const { bucket, key } = getBucketAndKey(row.logo_url);
                try {
                    const signedUrl = await getPresignedUrl(key, bucket);
                    return { ...row, logo_url_signed: signedUrl };
                } catch (error) {
                    return { ...row, logo_url_signed: null };
                }
            })
        );

        return NextResponse.json({ brands });
    } catch (error: any) {
        console.error('Error fetching shop brands:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shop brands', details: error?.message },
            { status: 500 }
        );
    }
}

// PUT - Replace featured shop brands
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { brands } = body;

        if (!Array.isArray(brands)) {
            return NextResponse.json(
                { error: 'brands must be an array' },
                { status: 400 }
            );
        }

        await query('BEGIN');
        await query('DELETE FROM shop_featured_brands');

        for (let i = 0; i < brands.length; i++) {
            const brand = brands[i];
            if (!brand?.name || !brand?.slug) continue;

            await query(
                `INSERT INTO shop_featured_brands (name, slug, logo_url, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug)
         DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, sort_order = EXCLUDED.sort_order`,
                [brand.name, brand.slug, brand.logo_url || null, i]
            );
        }

        await query('COMMIT');

        return NextResponse.json({ success: true, count: brands.length });
    } catch (error: any) {
        console.error('Error updating shop brands:', error);
        await query('ROLLBACK');
        return NextResponse.json(
            { error: 'Failed to update shop brands', details: error?.message },
            { status: 500 }
        );
    }
}