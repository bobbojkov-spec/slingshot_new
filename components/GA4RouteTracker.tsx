'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview, isEnabled } from '@/lib/ga4';

/**
 * GA4RouteTracker Component
 * 
 * Automatically tracks pageviews when the route changes in Next.js App Router
 * Should be included once in the root layout
 * 
 * How it works:
 * - Listens to route changes via usePathname and useSearchParams
 * - Sends pageview events to GA4 when URL changes
 * - Includes both pathname and search params in tracking
 * - Only tracks if GA4 is enabled and configured
 */
export default function GA4RouteTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Don't track if GA4 is not enabled
        if (!isEnabled()) return;

        // Construct full URL path including search params
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

        // Track the pageview
        pageview(url);

        // Log in development for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4] Pageview tracked:', url);
        }
    }, [pathname, searchParams]);

    // This component doesn't render anything
    return null;
}
