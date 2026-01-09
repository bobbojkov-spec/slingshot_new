import { NextRequest, NextResponse } from 'next/server';
import { getPublicUrl } from '@/lib/railway/s3-client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;

        if (!path || path.length === 0) {
            return new NextResponse('Image path missing', { status: 400 });
        }

        // Reconstruct the key from path segments
        // decoding URI components to handle spaces etc.
        const key = path.map(segment => decodeURIComponent(segment)).join('/');

        // Get signed URL from S3 client
        // We force 'signed: true' to ensure access to private buckets
        const url = await getPublicUrl(key, undefined, true);

        // Redirect to the signed S3 URL
        // 307 Temporary Redirect preserves the method (GET)
        return NextResponse.redirect(url, 307);

    } catch (error: any) {
        console.error('Error proxying image:', error);
        return new NextResponse('Image not found', { status: 404 });
    }
}
