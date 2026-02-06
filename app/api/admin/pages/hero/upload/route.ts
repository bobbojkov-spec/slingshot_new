import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sharp, { type ResizeOptions } from 'sharp';
import { uploadPublicImage } from '@/lib/railway/storage';

type UploadVariant = {
    size: 'thumb' | 'middle' | 'full';
    quality: number;
    resize: ResizeOptions;
};

const VARIANTS: UploadVariant[] = [
    { size: 'thumb', quality: 80, resize: { width: 300, fit: 'inside' } },
    { size: 'middle', quality: 85, resize: { width: 1000, fit: 'inside' } },
    { size: 'full', quality: 90, resize: { width: 1900, fit: 'inside' } },
];

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
        // Convert to a high-quality base buffer first
        const baseBuffer = await sharp(buffer).jpeg({ quality: 100 }).toBuffer();

        const bundleId = randomUUID();
        const timestamp = Date.now();
        const originalName = sanitizeFileName(file.name || 'hero.jpg');
        const baseFolder = `pages/hero/${pageId || 'new'}/${bundleId}`;

        const uploadPromises = VARIANTS.map(async (variant) => {
            const transformed = await sharp(baseBuffer)
                .resize(variant.resize)
                .jpeg({ quality: variant.quality })
                .toBuffer();

            const path = `${baseFolder}/${variant.size}/${timestamp}-${originalName}`;
            const uploaded = await uploadPublicImage(path, transformed, {
                contentType: 'image/jpeg',
                upsert: true,
            });

            return {
                size: variant.size,
                url: uploaded.publicUrl,
                path: uploaded.path,
            };
        });

        const uploadedVariants = await Promise.all(uploadPromises);

        // Create a structured response with all URLs
        const result = {
            bundleId,
            // The relative storage paths for database persistence
            paths: uploadedVariants.reduce((acc, v) => ({ ...acc, [v.size]: v.path }), {} as Record<string, string>),
            // Pre-signed URLs for immediate frontend display
            urls: uploadedVariants.reduce((acc, v) => ({ ...acc, [v.size]: v.url }), {} as Record<string, string>),
        };

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Hero image upload failed', error);
        return NextResponse.json(
            { error: error?.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
