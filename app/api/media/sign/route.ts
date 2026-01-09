import { NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/railway/storage";

// Simple in-memory cache
// Key: path, Value: { url: string, expiresAt: number }
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
    try {
        const { paths } = await req.json();

        if (!Array.isArray(paths) || paths.length === 0) {
            return NextResponse.json({ urls: {} });
        }

        const now = Date.now();
        const urls: Record<string, string> = {};

        const pathsToSign: string[] = [];

        // Check cache first
        for (const path of paths) {
            if (!path) continue;

            // Safety check: if path is already a URL, don't sign it again
            if (path.startsWith('http') || path.startsWith('data:')) {
                urls[path] = path;
                continue;
            }

            const cached = urlCache.get(path);
            if (cached && cached.expiresAt > now) {
                urls[path] = cached.url;
            } else {
                pathsToSign.push(path);
            }
        }

        // Sign missing paths
        if (pathsToSign.length > 0) {
            const MAX_CONCURRENT = 10;
            for (let i = 0; i < pathsToSign.length; i += MAX_CONCURRENT) {
                const chunk = pathsToSign.slice(i, i + MAX_CONCURRENT);
                await Promise.all(
                    chunk.map(async (path) => {
                        try {
                            // Note: getPresignedUrl uses S3 client which is fast, but waiting for network
                            // We'll sign for slightly longer than cache to be safe
                            const signedUrl = await getPresignedUrl(path, undefined, 60 * 10); // 10 mins expiry

                            urls[path] = signedUrl;
                            urlCache.set(path, {
                                url: signedUrl,
                                expiresAt: now + CACHE_DURATION_MS,
                            });
                        } catch (error) {
                            console.error(`Failed to sign URL for path: ${path}`, error);
                            // Do not add to urls map, frontend handles missing keys
                        }
                    })
                );
            }
        }

        return NextResponse.json({ urls });
    } catch (error: any) {
        console.error("Sign API Error:", error);
        return NextResponse.json(
            { error: "Failed to sign URLs", details: error.message },
            { status: 500 }
        );
    }
}
