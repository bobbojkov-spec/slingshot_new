import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl } from '@/lib/railway/storage';
import { query } from '@/lib/dbPg';
import { listBlocksForPage, PageBlockRecord } from '@/lib/pagesNewBlocksDb';
import { convertToProxyUrl } from '@/lib/utils/image-url';

const PLACEHOLDER_IMAGE = '/api/images/original/placeholder.jpg';

const isPositiveInt = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) && Number.isInteger(numberValue) && numberValue >= 1;
};

// Use centralized signing logic which handles:
// 1. AWS/Railway SDK credentials (including new AWS_* fallbacks)
// 2. Correct Bucket resolution (AWS_S3_BUCKET_NAME etc)
// 3. Connection pooling via shared client
const signUrl = async (key: string | null | undefined) => {
    if (!key) return null;
    if (key.startsWith('http') || key.startsWith('/')) {
        return convertToProxyUrl(key);
    }
    try {
        // getPresignedUrl handles client details and defaults to PUBLIC bucket
        return await getPresignedUrl(key, undefined, 3600);
    } catch (error) {
        console.error('Error signing URL:', error);
        return convertToProxyUrl(key);
    }
};

const normalizeBlockData = async (block: PageBlockRecord) => ({
    id: String(block.id),
    pageId: String(block.page_id),
    type: block.type,
    position: typeof block.position === 'number' ? block.position : 0,
    enabled: block.enabled !== false,
    data: block.data ?? {},
    galleryImages: await Promise.all((block.gallery_images ?? []).map(async (image) => ({
        mediaId: image.media_id,
        position: typeof image.position === 'number' ? image.position : 0,
        url: (await signUrl(image.url)) ?? PLACEHOLDER_IMAGE,
    }))),
});

const extractMediaIds = (block: PageBlockRecord): number[] => {
    const ids: number[] = [];
    const data = block.data;
    if (data && typeof data === 'object') {
        const backgroundImage = (data as any).background_image;
        if (backgroundImage && typeof backgroundImage === 'object') {
            const mediaId = Number(backgroundImage.media_id);
            if (Number.isFinite(mediaId)) {
                ids.push(mediaId);
            }
        }
        if ((data as any).image_id !== undefined) {
            const imageId = Number((data as any).image_id);
            if (Number.isFinite(imageId)) {
                ids.push(imageId);
            }
        }
    }
    return ids;
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
        return NextResponse.json(
            { ok: false, error: 'Missing id' },
            { status: 400 }
        );
    }

    try {
        void request;
        const pageId = Number(id);
        if (!isPositiveInt(pageId)) {
            return NextResponse.json({ ok: false, error: 'Invalid pageId' }, { status: 400 });
        }

        const { rows: pageRows } = await query(
            'SELECT id, status FROM pages WHERE id = $1 LIMIT 1',
            [pageId]
        );

        if (!pageRows.length) {
            return NextResponse.json({ ok: false, error: 'Page not found' }, { status: 404 });
        }

        const pageStatus = pageRows[0].status;

        // Disabled publish check to allow admin to view drafts if needed
        // if (pageStatus !== 'published') {
        //     // return NextResponse.json({ ok: false, error: 'Page is not published' }, { status: 404 });
        // }

        const blocks = await listBlocksForPage(pageId);

        // Return all blocks (disabled ones included) for admin/editor context
        const validBlocks = blocks.filter((block) => block.enabled !== false);

        const mediaIdSet = new Set<number>();
        validBlocks.forEach((block) => {
            extractMediaIds(block).forEach((id) => mediaIdSet.add(id));
        });

        const mediaMap: Record<number, string> = {};
        if (mediaIdSet.size) {
            const { rows: mediaRows } = await query(
                'SELECT id, url FROM media_files WHERE id = ANY($1)',
                [Array.from(mediaIdSet)]
            );
            for (const mediaRow of mediaRows) {
                const id = typeof mediaRow.id === 'number' ? mediaRow.id : Number(mediaRow.id);
                const url = typeof mediaRow.url === 'string' ? mediaRow.url : null;
                mediaMap[id] = (await signUrl(url)) ?? PLACEHOLDER_IMAGE;
            }
        }

        const transformedBlocks = await Promise.all(validBlocks.map(normalizeBlockData));

        return NextResponse.json({
            ok: true,
            data: transformedBlocks,
            media: mediaMap,
        });
    } catch (error) {
        console.error('pages-new blocks GET failed:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to load blocks' },
            { status: 500 }
        );
    }
}
