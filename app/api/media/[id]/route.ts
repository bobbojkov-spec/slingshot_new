import { NextRequest, NextResponse } from 'next/server';
import { deleteMediaFile, getMediaFileById, setMediaPoolVisibility } from '@/lib/db/repositories/media';
import { deleteFromRailwayS3 } from '@/lib/railway/s3-client';
import { convertToProxyUrl } from '@/lib/utils/image-url';
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';

// Helper to extract S3 key from URL
function getS3Key(url: string | null): string | null {
    if (!url) return null;

    if (url.startsWith('/api/images/')) {
        return url.replace('/api/images/', '');
    }

    const match = url.match(/https?:\/\/[^\/]+\/[^\/]+\/(.+)$/);
    if (match) {
        return match[1];
    }

    return null;
}

// DELETE /api/media/[id] - Delete media file from S3 and database
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }
        const mediaId = parseInt(id);

        if (isNaN(mediaId)) {
            return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
        }

        // Get media file info before deleting
        const mediaFile = await getMediaFileById(mediaId);
        if (!mediaFile) {
            return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
        }

        // Delete from S3
        const filesToDelete = [
            mediaFile.url,
            mediaFile.url_large,
            mediaFile.url_medium,
            mediaFile.url_thumb,
        ].filter(Boolean) as string[];

        for (const fileUrl of filesToDelete) {
            try {
                const s3Key = getS3Key(fileUrl);
                if (s3Key) {
                    await deleteFromRailwayS3(s3Key);
                    console.log(`✅ Deleted from S3: ${s3Key}`);
                }
            } catch (s3Error: any) {
                console.error(`⚠️  Failed to delete from S3 ${fileUrl}:`, s3Error.message);
                // Continue even if S3 deletion fails
            }
        }

        // Delete from database
        await deleteMediaFile(mediaId);

        return NextResponse.json({
            success: true,
            message: 'Media file deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting media file:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete media file',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

// GET /api/media/[id] - Return media file details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }
        const mediaId = parseInt(id, 10);

        if (Number.isNaN(mediaId)) {
            return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
        }

        const mediaFile = await getMediaFileById(mediaId);
        if (!mediaFile) {
            return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
        }

        const responsePayload = {
            ...mediaFile,
            url: convertToProxyUrl(mediaFile.url) || convertToProxyUrl(mediaFile.url_large) || PLACEHOLDER_IMAGE,
            url_large: convertToProxyUrl(mediaFile.url_large),
            url_medium: convertToProxyUrl(mediaFile.url_medium),
            url_thumb: convertToProxyUrl(mediaFile.url_thumb),
        };

        return NextResponse.json({ data: responsePayload });
    } catch (error: any) {
        console.error('Error fetching media file:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch media file',
                details: error?.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// PATCH /api/media/[id] - Update media pool visibility
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }
        const mediaId = parseInt(id, 10);

        if (Number.isNaN(mediaId)) {
            return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
        }

        const payload = await request.json();
        const shouldInclude = Boolean(payload?.is_in_media_pool);
        await setMediaPoolVisibility(mediaId, shouldInclude);

        return NextResponse.json({ ok: true, mediaId, is_in_media_pool: shouldInclude });
    } catch (error) {
        console.error('Error updating media visibility:', error);
        return NextResponse.json(
            { error: 'Failed to update media visibility', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
