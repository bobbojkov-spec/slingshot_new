import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl } from '@/lib/railway/storage';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        // If it's already a full URL or absolute path, return as is (security check recommended for prod)
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
