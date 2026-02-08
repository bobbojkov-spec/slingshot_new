import { InventoryPage } from "./inventory";
import { aiVisibilityConfig } from "./config";

export function generateOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${aiVisibilityConfig.baseUrl}/#organization`,
        "name": aiVisibilityConfig.siteName,
        "url": aiVisibilityConfig.baseUrl,
        "logo": aiVisibilityConfig.logoUrl,
        "sameAs": aiVisibilityConfig.socialProfiles,
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "url": aiVisibilityConfig.contactUrl,
                "contactType": "customer service"
            }
        ]
    };
}

export function generateJsonLd(page: InventoryPage, data?: any) {
    const orgSchema = generateOrganizationSchema();

    // Base WebPage schema
    const baseSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${page.url}/#webpage`,
        "name": page.title,
        "description": page.description,
        "url": page.url,
        "publisher": { "@id": `${aiVisibilityConfig.baseUrl}/#organization` },
        "isPartOf": {
            "@type": "WebSite",
            "@id": `${aiVisibilityConfig.baseUrl}/#website`,
            "name": aiVisibilityConfig.siteName,
            "url": aiVisibilityConfig.baseUrl
        }
    };

    if (page.type === "product" && data) {
        return {
            "@context": "https://schema.org",
            "@type": "Product",
            "@id": `${page.url}/#product`,
            "name": page.title,
            "description": page.description,
            "url": page.url,
            "brand": {
                "@type": "Brand",
                "name": data.brand || "Slingshot"
            },
            "offers": {
                "@type": "Offer",
                "url": page.url,
                "priceCurrency": "BGN",
                "price": data.price || "0.00",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": `${aiVisibilityConfig.baseUrl}/#organization` }
            }
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
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": `${page.url}/#article`,
            "headline": page.title,
            "description": page.description,
            "datePublished": page.updatedAt?.toISOString(),
            "author": { "@id": `${aiVisibilityConfig.baseUrl}/#organization` },
            "publisher": { "@id": `${aiVisibilityConfig.baseUrl}/#organization` },
            "mainEntityOfPage": { "@id": `${page.url}/#webpage` }
        };
    }

    return [orgSchema, baseSchema];
}
