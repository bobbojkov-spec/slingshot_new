
import { NextResponse } from 'next/server';
import { uploadPublicImage } from '@/lib/railway/storage';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${folder}/${uniqueSuffix}-${filename}`;

        const { publicUrl } = await uploadPublicImage(path, buffer, {
            contentType: file.type,
            bucket: process.env.RAILWAY_STORAGE_BUCKET_PUBLIC // Explicitly use public bucket
        });

        return NextResponse.json({
            url: publicUrl,
            success: true
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
