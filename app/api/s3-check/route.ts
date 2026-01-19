import { NextRequest, NextResponse } from 'next/server';
import { listPublicImages, getPresignedUrl, getKeyFromUrl, STORAGE_BUCKETS, fileExists } from '@/lib/railway/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const path = searchParams.get('path');

        const debugInfo: any = {
            env: {
                bucketPublic: STORAGE_BUCKETS.PUBLIC,
                bucketRaw: STORAGE_BUCKETS.RAW,
                region: process.env.RAILWAY_STORAGE_REGION,
                hasEndpoint: !!process.env.RAILWAY_STORAGE_ENDPOINT,
                hasAccessKey: !!process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
                hasSecretKey: !!process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
            },
            listFiles: [],
            pathCheck: null
        };

        // List files
        try {
            const files = await listPublicImages('', 10);
            debugInfo.listFiles = files;
        } catch (e: any) {
            debugInfo.listFilesError = e.message;
            console.error('List files error:', e);
        }

        // Path check
        if (path) {
            let extractedKey = getKeyFromUrl(path);
            let exists = false;
            let signedUrl = '';

            try {
                signedUrl = await getPresignedUrl(path);
                exists = await fileExists(path);
            } catch (e: any) {
                console.error('Path check error (original):', e);
            }

            // Try stripping bucket if present in path (common mistake)
            let pathWithoutBucket = path;
            const bucketPrefix = STORAGE_BUCKETS.PUBLIC + '/';
            if (path.startsWith(bucketPrefix)) {
                pathWithoutBucket = path.substring(bucketPrefix.length);
            }

            let existsNoBucket = false;
            let signedUrlNoBucket = '';

            if (pathWithoutBucket !== path) {
                try {
                    signedUrlNoBucket = await getPresignedUrl(pathWithoutBucket);
                    existsNoBucket = await fileExists(pathWithoutBucket);
                } catch (e: any) {
                    console.error('Path check error (no bucket):', e);
                }
            }

            debugInfo.pathCheck = {
                originalPath: path,
                extractedKey,
                signedUrl,
                exists,
                pathWithoutBucket,
                signedUrlNoBucket,
                existsNoBucket
            };
        }

        return NextResponse.json(debugInfo);
    } catch (error: any) {
        console.error('Debug endpoint fatal error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
