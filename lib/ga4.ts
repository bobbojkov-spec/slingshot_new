/**
 * Google Analytics 4 Helper Library
 * 
 * Provides type-safe functions for GA4 tracking in Next.js
 * Guards against SSR and missing window/gtag references
 */

// Extend Window interface to include gtag
declare global {
    interface Window {
        gtag?: (
            command: 'config' | 'event' | 'js' | 'set',
            targetId: string | Date,
            config?: Record<string, unknown>
        ) => void;
        dataLayer?: unknown[];
    }
}

/**
 * Check if GA4 is enabled and available
 * @returns true if GA4 measurement ID is configured and gtag is loaded
 */
export function isEnabled(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.gtag === 'function' &&
        !!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
    );
}

/**
 * Get the GA4 Measurement ID from environment variables
 * @returns GA4 Measurement ID or empty string if not configured
 */
export function getMeasurementId(): string {
    return process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
}

/**
 * Track a pageview event
 * @param url - The page path to track (e.g., '/products' or '/about?ref=home')
 */
export function pageview(url: string): void {
    if (!isEnabled()) return;

    window.gtag!('event', 'page_view', {
        page_path: url,
    });
}

/**
 * Track a custom event
 * @param name - Event name (e.g., 'add_to_cart', 'purchase', 'sign_up')
 * @param params - Optional event parameters
 */
export function event(name: string, params?: Record<string, unknown>): void {
    if (!isEnabled()) return;

    window.gtag!('event', name, params);
}

/**
 * Track e-commerce events with enhanced parameters
 */
export const ecommerce = {
    /**
     * Track when a user views a product
     */
    viewItem: (params: {
        currency?: string;
        value?: number;
        items: Array<{
            item_id: string;
            item_name: string;
            item_category?: string;
            item_brand?: string;
            price?: number;
            quantity?: number;
        }>;
    }) => {
        event('view_item', params);
    },

    /**
     * Track when a user adds a product to cart
     */
    addToCart: (params: {
        currency?: string;
        value?: number;
        items: Array<{
            item_id: string;
            item_name: string;
            item_category?: string;
            item_brand?: string;
            price?: number;
            quantity?: number;
        }>;
    }) => {
        event('add_to_cart', params);
    },

    /**
     * Track when a user removes a product from cart
     */
    removeFromCart: (params: {
        currency?: string;
        value?: number;
        items: Array<{
            item_id: string;
            item_name: string;
            item_category?: string;
            item_brand?: string;
            price?: number;
            quantity?: number;
        }>;
    }) => {
        event('remove_from_cart', params);
    },

    /**
     * Track when a user begins checkout
     */
    beginCheckout: (params: {
        currency?: string;
        value?: number;
        items: Array<{
            item_id: string;
            item_name: string;
            item_category?: string;
            item_brand?: string;
            price?: number;
            quantity?: number;
        }>;
    }) => {
        event('begin_checkout', params);
    },

    /**
     * Track a completed purchase
     */
    purchase: (params: {
        transaction_id: string;
        currency?: string;
        value?: number;
        tax?: number;
        shipping?: number;
        items: Array<{
            item_id: string;
            item_name: string;
            item_category?: string;
            item_brand?: string;
            price?: number;
            quantity?: number;
        }>;
    }) => {
        event('purchase', params);
    },
};

/**
 * Track user engagement events
 */
export const engagement = {
    /**
     * Track when a user searches
     */
    search: (searchTerm: string) => {
        event('search', { search_term: searchTerm });
    },

    /**
     * Track when a user clicks a link
     */
    clickLink: (linkUrl: string, linkText?: string) => {
        event('click_link', {
            link_url: linkUrl,
            link_text: linkText,
        });
    },

    /**
     * Track when a user submits a form
     */
    submitForm: (formName: string) => {
        event('form_submit', { form_name: formName });
    },

    /**
     * Track video interactions
     */
    videoPlay: (videoTitle: string) => {
        event('video_start', { video_title: videoTitle });
    },

    videoComplete: (videoTitle: string) => {
        event('video_complete', { video_title: videoTitle });
    },
};
