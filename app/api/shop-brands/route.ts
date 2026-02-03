import { NextResponse } from 'next/server';
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