import { NextRequest, NextResponse } from 'next/server';
import { downloadFile, STORAGE_BUCKETS, isRailwayStorageConfigured } from '@/lib/railway/storage';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const path = searchParams.get('path');
        const bucket = searchParams.get('bucket') || STORAGE_BUCKETS.PUBLIC;

        if (!path) {
            return new NextResponse('Missing path parameter', { status: 400 });
        }

        // Don't throw if not configured, just return a 503 or 404
        if (!isRailwayStorageConfigured()) {
            console.warn('[API MEDIA RAW] Railway Storage not configured, cannot serve file:', path);
            return new NextResponse('Storage not configured', { status: 503 });
        }

        const buffer = await downloadFile(path, bucket);

        // Determine content type based on extension
        const ext = path.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'webp') contentType = 'image/webp';
        else if (ext === 'gif') contentType = 'image/gif';
        else if (ext === 'svg') contentType = 'image/svg+xml';

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error: any) {
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404 || error.message?.includes('404')) {
            return new NextResponse('File not found', { status: 404 });
        }
        console.error('[API MEDIA RAW] Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
