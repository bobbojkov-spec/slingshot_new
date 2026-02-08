import { InventoryPage } from "./inventory";
import { aiVisibilityConfig } from "./config";

export function generateJsonLd(page: InventoryPage, data?: any) {
    // Base WebPage schema
    const baseSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": page.title,
        "description": page.description,
        "url": page.url,
        "isPartOf": {
            "@type": "WebSite",
            "name": aiVisibilityConfig.siteName,
            "url": aiVisibilityConfig.baseUrl
        }
    };

    if (page.type === "product" && data) {
        // Enhance with product specific data if available passed from component
        // This function usually runs in the component where data is available
        return {
            ...baseSchema,
            "@type": "Product",
            "name": page.title,
            "description": page.description,
            // Add price, sku, etc if we passed 'data' (the product object)
        };
    }

    if (page.type === "collection") {
        return {
            ...baseSchema,
            "@type": "CollectionPage",
        };
    }

    if (page.type === "article") {
        return {
            ...baseSchema,
            "@type": "Article",
            "headline": page.title,
            "datePublished": page.updatedAt?.toISOString(),
        };
    }

    return baseSchema;
}
