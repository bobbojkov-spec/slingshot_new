"use client";

import { useState, useEffect, useCallback } from "react";

export function useSignedImages(paths: string[]) {
    const [urls, setUrls] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Helper to normalize paths and filter out empty ones
    const validPaths = paths.filter((p) => p && typeof p === "string");

    // We only want to sign paths that are NOT already URLs
    const pathsToSign = validPaths.filter(p => !p.startsWith('http') && !p.startsWith('data:'));

    // Create a key only based on paths that actually need signing
    const pathsKey = pathsToSign.sort().join(",");

    useEffect(() => {
        let cancelled = false;

        if (pathsToSign.length === 0) {
            setLoading(false);
            return;
        }

        // Dev-only guardrail
        if (process.env.NODE_ENV === "development") {
            pathsToSign.forEach((p) => {
                if (p.startsWith("/")) {
                    console.warn(
                        `[useSignedImages] potentially raw path detected: ${p}. Expected relative path (e.g. product-images/...).`
                    );
                }
            });
        }

        async function fetchSignedUrls() {
            try {
                setLoading(true);
                const res = await fetch("/api/media/sign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paths: pathsToSign }),
                });

                if (!res.ok) {
                    throw new Error(`Sign API failed: ${res.status}`);
                }

                const data = await res.json();
                if (!cancelled) {
                    setUrls((prev) => ({ ...prev, ...data.urls }));
                }
            } catch (err: any) {
                if (!cancelled) {
                    console.error("Failed to sign images:", err);
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchSignedUrls();

        return () => {
            cancelled = true;
        };
    }, [pathsKey]);

    const getUrl = useCallback(
        (path: string | undefined | null) => {
            if (!path) return undefined;
            // If it's already a URL, return it as is
            if (path.startsWith('http') || path.startsWith('data:')) return path;
            return urls[path];
        },
        [urls]
    );

    return { urls, getUrl, loading, error };
}
