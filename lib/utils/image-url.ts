/**
 * Cloud Image URL Utilities
 * All images must come from cloud storage (Railway S3)
 * No local file serving
 */

/**
 * Image "object key" format in our bucket.
 * Examples:
 * - original/foo.jpg
 * - large/foo_large.jpg
 * - medium/foo_medium.jpg
 * - thumb/foo_thumb.jpg
 */
export type ImageObjectKey = string;

/**
 * Extract an S3 object key from:
 * - our DB values (preferred): "original/foo.jpg"
 * - proxy URLs: "/api/images/original/foo.jpg"
 * - Railway S3 URLs:
 *   - path-style: https://storage.railway.app/<bucket>/<key>
 *   - virtual-hosted-style: https://<bucket>.storage.railway.app/<key>
 *
 * Returns null when the input is not a Railway S3 / proxy value (e.g. data: URIs).
 */
export function toImageObjectKey(input: string | null | undefined): ImageObjectKey | null {
    if (!input) return null;

    const raw = String(input).trim();
    if (!raw) return null;

    // Data URIs are already browser-safe and not S3 objects
    if (raw.startsWith('data:')) return null;

    // Already a proxy URL
    if (raw.startsWith('/api/images/')) {
        const key = raw.replace(/^\/api\/images\//, '').replace(/^\/+/, '');
        return key || null;
    }

    // Already a key (preferred storage format)
    if (
        raw.startsWith('original/') ||
        raw.startsWith('large/') ||
        raw.startsWith('medium/') ||
        raw.startsWith('thumb/')
    ) {
        return raw.replace(/^\/+/, '');
    }

    // Check for known content directories (e.g. from bucket paths like /bucket/product-images/...)
    const knownPrefixes = ['product-images/', 'media-library/', 'hero-slides/', 'news-images/'];
    for (const prefix of knownPrefixes) {
        const idx = raw.indexOf(prefix);
        if (idx !== -1) {
            return raw.substring(idx);
        }
    }

    // Some callers may pass "placeholder.jpg" - treat as an object key in original/
    if (!raw.includes('://') && !raw.startsWith('/')) {
        return raw.replace(/^\/+/, '');
    }

    // URL inputs (legacy DB values)
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
            const url = new URL(raw);
            const hostname = url.hostname;
            const pathname = url.pathname.replace(/^\/+/, ''); // remove leading slash

            // Virtual-hosted-style: <bucket>.storage.railway.app/<key>
            if (hostname.endsWith('.storage.railway.app')) {
                return pathname || null;
            }

            // Path-style: storage.railway.app/<bucket>/<key>
            if (hostname === 'storage.railway.app') {
                const parts = pathname.split('/');
                if (parts.length >= 2) {
                    // remove bucket segment
                    return parts.slice(1).join('/') || null;
                }
            }

            // Custom S3_PUBLIC_URL: public URL + /<key>
            const publicBase = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || process.env.S3_PUBLIC_URL;
            if (publicBase) {
                try {
                    const base = new URL(publicBase);
                    if (hostname === base.hostname) {
                        const basePath = base.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
                        const key = basePath ? pathname.replace(new RegExp(`^${basePath}\\/`), '') : pathname;
                        return key || null;
                    }
                } catch {
                    // ignore malformed base URL
                }
            }
        } catch {
            // fall through
        }
    }

    return null;
}

/**
 * Get cloud image URL for a given path
 * Uses Next.js API proxy route (Railway S3 buckets are private)
 * Paths should be relative (e.g., "original/filename.jpg" or "about-us-img-1-1.jpg")
 */
export function getCloudImageUrl(path: string | null | undefined): string {
    const key = toImageObjectKey(path);
    if (!key) return getPlaceholderUrl();
    return `/api/images/${key}`;
}

/**
 * Get placeholder image URL from cloud
 */
export function getPlaceholderUrl(): string {
    // This should be an object in the bucket (preferred) but falls back to a stable proxy URL.
    return `/api/images/original/placeholder.jpg`;
}

/**
 * Convert URLs to proxy URLs (Railway buckets are private)
 */
export function convertToProxyUrl(s3Url: string | null | undefined): string | null {
    const key = toImageObjectKey(s3Url);
    if (!key) return null;
    return `/api/images/${key}`;
}

/**
 * Convert array of image URLs to cloud URLs
 */
export function convertImageUrls(urls: (string | null | undefined)[]): string[] {
    return urls
        .map(url => convertToProxyUrl(url))
        .filter((url): url is string => url !== null);
}

/**
 * Convert URLs to proxy URLs (Railway buckets are private)
 */
export function convertProxyUrlToDirect(proxyUrl: string | null | undefined): string {
    if (proxyUrl?.startsWith('data:')) return proxyUrl;
    const key = toImageObjectKey(proxyUrl);
    if (!key) return getPlaceholderUrl();
    return `/api/images/${key}`;
}
