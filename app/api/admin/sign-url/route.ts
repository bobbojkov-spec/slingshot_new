import { NextRequest, NextResponse } from 'next/server';
import { getKeyFromUrl, getPresignedUrl } from '@/lib/railway/storage';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        // If it's already a full URL, try to extract bucket + key
        if (path.startsWith('http')) {
            try {
                const parsed = new URL(path);
                const [bucket, ...rest] = parsed.pathname.replace(/^\//, '').split('/');
                const keyFromPath = rest.join('/') || getKeyFromUrl(path) || path;
                const signedUrl = await getPresignedUrl(keyFromPath, bucket || undefined);
                return NextResponse.json({ url: signedUrl });
            } catch (error) {
                // fall through to generic handling
            }
        }

        const key = getKeyFromUrl(path);
        if (key) {
            const signedUrl = await getPresignedUrl(key);
            return NextResponse.json({ url: signedUrl });
        }

        // If not our key and looks like external URL, return as is
        if (path.startsWith('http') || path.startsWith('/')) {
            return NextResponse.json({ url: path });
        }

        const signedUrl = await getPresignedUrl(path);
        return NextResponse.json({ url: signedUrl });
    } catch (error: any) {
        console.error('Signing failed', error);
        return NextResponse.json({ error: 'Failed to sign URL' }, { status: 500 });
    }
}
