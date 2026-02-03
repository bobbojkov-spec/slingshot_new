'use client';

import Script from 'next/script';
import { getMeasurementId } from '@/lib/ga4';

/**
 * GoogleAnalytics Component
 * 
 * Loads Google Analytics 4 (GA4) tracking scripts
 * Should be included once in the root layout
 * 
 * Features:
 * - Loads gtag.js from Google Tag Manager
 * - Initializes GA4 with measurement ID from environment
 * - Disables automatic pageview tracking (handled by RouteTracker)
 * - Only loads in production or when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set
 */
export default function GoogleAnalytics() {
    const measurementId = getMeasurementId();

    // Don't load GA4 if measurement ID is not configured
    if (!measurementId) {
        return null;
    }

    return (
        <>
            {/* Load gtag.js script from Google Tag Manager */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />

            {/* Initialize GA4 with configuration */}
            <Script
                id="google-analytics-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', '${measurementId}', {
              send_page_view: false,  // Disable automatic pageview tracking
              page_path: window.location.pathname + window.location.search
            });
          `,
                }}
            />
        </>
    );
}
