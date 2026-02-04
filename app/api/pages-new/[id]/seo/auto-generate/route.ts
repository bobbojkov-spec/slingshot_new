import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { convertToProxyUrl } from '@/lib/utils/image-url';
import { generateProductSEO } from '@/lib/seo/generate-product-seo';

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

const fetchHeroBackground = async (pageId: number) => {
    const { rows } = await query(
        `
    SELECT data
    FROM page_blocks
    WHERE page_id = $1 AND type = 'HERO'
    ORDER BY position ASC
    LIMIT 1
    `,
        [pageId]
    );

    const hero = rows[0];
    const backgroundImageId = hero?.data?.background_image?.media_id
        ? Number(hero.data.background_image.media_id)
        : null;

    if (!backgroundImageId) {
        return { imageId: null, imageUrl: null };
    }

    const { rows: mediaRows } = await query(
        `
    SELECT url, url_large, url_medium, url_thumb
    FROM media_files
    WHERE id = $1
    `,
        [backgroundImageId]
    );

    const file = mediaRows[0];
    const imageUrl =
        convertToProxyUrl(file?.url) ||
        convertToProxyUrl(file?.url_large) ||
        convertToProxyUrl(file?.url_medium) ||
        convertToProxyUrl(file?.url_thumb) ||
        null;

    return { imageId: backgroundImageId, imageUrl };
};

const fetchTextBlockDescription = async (pageId: number) => {
    const { rows } = await query(
        `
    SELECT data
    FROM page_blocks
    WHERE page_id = $1 AND type IN ('TEXT', 'TEXT_IMAGE')
    ORDER BY position ASC
    LIMIT 1
    `,
        [pageId]
    );

    const block = rows[0];
    if (!block || !block.data) {
        return '';
    }

    if (typeof block.data.content === 'string' && block.data.content.trim()) {
        return block.data.content.trim();
    }

    return '';
};

export async function POST(
    _: NextRequest,
    context: { params: Promise<{ id?: string }> }
) {
    try {
        const { id } = await context.params;
        const pageId = parseId(id);
        const { rows } = await query(
            `
      SELECT id, title, slug
      FROM pages
      WHERE id = $1
      `,
            [pageId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Page not found' },
                { status: 404 }
            );
        }

        const page = rows[0];
        const { imageId, imageUrl } = await fetchHeroBackground(pageId);
        const description = await fetchTextBlockDescription(pageId);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const seoData = generateProductSEO(
            {
                id: Number(page.id),
                name: page.title || '',
                slug: page.slug || '',
                description,
                price: null, // Pages don't have prices
                currency: 'EUR',
                categoryNames: [],
                tags: [],
                firstImageUrl: imageUrl,
            },
            baseUrl
        );

        return NextResponse.json({
            ok: true,
            data: {
                metaTitle: seoData.metaTitle,
                metaDescription: seoData.metaDescription,
                seoKeywords: seoData.seoKeywords,
                ogTitle: seoData.ogTitle,
                ogDescription: seoData.ogDescription,
                ogImageUrl: imageUrl,
                og_image_id: imageId,
                canonicalUrl: `${baseUrl}/pages/${page.slug}`,
            },
        });
    } catch (error) {
        console.error('Pages-new SEO generation failed', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to generate SEO data' },
            { status: 500 }
        );
    }
}
