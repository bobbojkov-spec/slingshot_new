import { NextRequest, NextResponse } from 'next/server';
import { uploadPublicImage } from '@/lib/railway/storage';

function sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9_.-]/g, '').replace(/\s+/g, '_');
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get('file') as File | null;
        const pageId = form.get('pageId') as string | null;

        if (!file) {
            return NextResponse.json(
                { error: 'file is required' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Validation (optional, but good practice)
        if (!file.type.startsWith('video/')) {
            return NextResponse.json(
                { error: 'File must be a video' },
                { status: 400 }
            );
        }

        const timestamp = Date.now();
        const originalName = sanitizeFileName(file.name || 'video.mp4');
        const path = `pages/hero-video/${pageId || 'new'}/${timestamp}-${originalName}`;

        const uploaded = await uploadPublicImage(path, buffer, {
            contentType: file.type || 'video/mp4',
            upsert: true,
        });

        return NextResponse.json({
            url: uploaded.publicUrl,
            path: uploaded.path,
            size: buffer.length
        });
    } catch (error: any) {
        console.error('Video upload failed', error);
        return NextResponse.json(
            { error: error?.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
