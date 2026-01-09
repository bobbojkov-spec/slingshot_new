import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { uploadPublicImage } from '@/lib/railway/storage';

function sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9_.-]/g, '');
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        //Optimize image (standardize to high-quality JPEG)
        const processedBuffer = await sharp(buffer)
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();

        const timestamp = Date.now();
        const name = sanitizeFileName(file.name || `hero-${timestamp}.jpg`);

        // Path: content-images/hero/<timestamp>-<name>
        const storagePath = `content-images/hero/${timestamp}-${name}`;

        const uploaded = await uploadPublicImage(storagePath, processedBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
        });

        return NextResponse.json({
            data: {
                url: uploaded.publicUrl,
                path: uploaded.path
            }
        });

    } catch (error: any) {
        console.error('Hero slide upload failed:', error);
        return NextResponse.json(
            { error: error?.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
