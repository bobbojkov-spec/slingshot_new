import { NextRequest, NextResponse } from 'next/server';
import { getMediaFiles, createMediaFile } from '@/lib/db/repositories/media';
import { processImageToRailwayS3 } from '@/lib/media/processor-railway';
import { STORAGE_BUCKETS } from '@/lib/railway/s3-client';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/media/config';
import { query } from '@/lib/db/connection';
import { MediaFile } from '@/lib/db/models';
import { convertToProxyUrl } from '@/lib/utils/image-url';
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';

// GET /api/media - Get media files
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Sanitize pagination inputs
        let page = parseInt(searchParams.get('page') || '1', 10);
        let pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

        // Ensure page >= 1
        if (isNaN(page) || page < 1) {
            page = 1;
        }

        // Ensure pageSize >= 1 and <= 100
        if (isNaN(pageSize) || pageSize < 1) {
            pageSize = 100;
        }
        if (pageSize > 100) {
            pageSize = 100; // Cap at 100 for list endpoints
        }

        const offset = (page - 1) * pageSize;
        const poolOnly = searchParams.get('poolOnly') === 'true';
        const poolFilter = poolOnly ? 'WHERE is_in_media_pool = TRUE' : '';

        // Use string interpolation for LIMIT/OFFSET to avoid parameter binding issues
        // MySQL LIMIT doesn't always work with parameterized queries
        const files = await query<MediaFile>(
            `SELECT id, filename, url, url_large, url_medium, url_thumb, mime_type, size, width, height, alt_text, caption, created_at 
       FROM media_files 
       ${poolFilter}
       ORDER BY created_at DESC 
       LIMIT ${pageSize} OFFSET ${offset}`
        );

        // Get total count
        const countFilter = poolOnly ? 'WHERE is_in_media_pool = TRUE' : '';
        const countResult = await query<{ count: number }>(
            `SELECT COUNT(*) as count FROM media_files ${countFilter}`
        );
        const total = countResult[0]?.count || 0;

        // Convert Railway S3 URLs to proxy URLs for local development
        const filesWithProxyUrls = files.map((file: any) => ({
            ...file,
            url: convertToProxyUrl(file.url) || convertToProxyUrl(file.url_large) || convertToProxyUrl(file.url_medium) || convertToProxyUrl(file.url_thumb) || PLACEHOLDER_IMAGE,
            url_large: convertToProxyUrl(file.url_large),
            url_medium: convertToProxyUrl(file.url_medium),
            url_thumb: convertToProxyUrl(file.url_thumb),
        }));

        return NextResponse.json({
            data: filesWithProxyUrls || [],
            total,
            page,
            pageSize,
        });
    } catch (error: any) {
        console.error('Error fetching media files:', error);
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch media files',
                details: error?.message || String(error),
            },
            { status: 500 }
        );
    }
}

// POST /api/media - Upload/create media file with image processing
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        const mimeType = file.type;

        // Generate unique filename to avoid conflicts
        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const uniqueFilename = `${timestamp}_${sanitizedFilename}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process image and upload to Railway S3 (generate all sizes)
        const processed = await processImageToRailwayS3(
            buffer,
            uniqueFilename,
            mimeType,
            process.env.S3_BUCKET_PUBLIC || STORAGE_BUCKETS.MEDIA_LIBRARY
        );

        // Save to database with Railway S3 URLs (convert to proxy URLs for local dev)
        const isDerived = formData.get('derived') === 'true';
        const width = processed.original.width ?? 0;
        const height = processed.original.height ?? 0;
        const isInPool = !isDerived && (width >= 800 || height >= 800);
        const mediaId = await createMediaFile({
            filename: uniqueFilename,
            // Store ONLY the object keys in DB (data model hygiene).
            // Public browser access is always via /api/images/<key>.
            url: processed.original.path,
            url_large: processed.large?.path || null,
            url_medium: processed.medium?.path || null,
            url_thumb: processed.thumb?.path || null,
            mime_type: mimeType,
            size: processed.original.size,
            width: processed.original.width,
            height: processed.original.height,
            alt_text: null,
            caption: null,
            source: isDerived ? 'derived' : 'upload',
            is_in_media_pool: isInPool,
        });

        // Convert URLs to proxy URLs for local development
        return NextResponse.json({
            data: {
                id: mediaId,
                filename: uniqueFilename,
                url: convertToProxyUrl(processed.original.path) || PLACEHOLDER_IMAGE,
                url_large: convertToProxyUrl(processed.large?.path) || null,
                url_medium: convertToProxyUrl(processed.medium?.path) || null,
                url_thumb: convertToProxyUrl(processed.thumb?.path) || null,
                mime_type: mimeType,
                size: processed.original.size,
                width: processed.original.width,
                height: processed.original.height,
                alt_text: null,
                caption: null,
                created_at: new Date(),
            },
        });
    } catch (error) {
        console.error('❌ Error creating media file:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
        console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : 'Unknown',
            cause: error instanceof Error ? error.cause : undefined,
        });
        return NextResponse.json(
            {
                error: 'Failed to create media file',
                details: error instanceof Error ? error.message : String(error),
                stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
            },
            { status: 500 }
        );
    }
}
