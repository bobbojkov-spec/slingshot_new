import { query } from "@/lib/db";
import { aiVisibilityConfig } from "./config";

export interface InventoryPage {
    url: string;
    path: string;
    type: "home" | "product" | "collection" | "article" | "category" | "faq" | "about" | "contact" | "legal" | "other";
    title: string | null;
    description: string | null;
    locale: string | null; // 'bg' | 'en' | null (mixed)
    updatedAt: Date | null;
    priority: number | null; // 0..1
    tags: string[] | null;
}

export interface InventoryData {
    site: {
        name: string;
        baseUrl: string;
        defaultLocale: string | null;
        locales: string[] | null;
    };
    generatedAt: Date;
    pages: InventoryPage[];
    important: {
        primary: string[];
        help: string[];
        legal: string[];
        sitemap: string | null;
        robots: string | null;
    };
}

// Simple in-memory cache for demonstration. 
// In production with serverless/multiple instances, prefer Redis.
let inventoryCache: { data: InventoryData; expiresAt: number } | null = null;

export async function getInventory(options?: { forceRefresh?: boolean }): Promise<InventoryData> {
    const now = Date.now();
    if (!options?.forceRefresh && inventoryCache && inventoryCache.expiresAt > now) {
        return inventoryCache.data;
    }

    const pages: InventoryPage[] = [];
    const baseUrl = aiVisibilityConfig.baseUrl;

    // 1. Static / Core Pages (Bilingual handled by simple alternates)
    const staticPages = [
        { path: "/", title: aiVisibilityConfig.siteName, priority: 1.0, tags: ["home"] },
        { path: "/shop", title: "Shop", priority: 0.9, tags: ["shop"] },
        { path: "/search", title: "Search", priority: 0.6, tags: ["search"] },
        { path: "/inquiry/contact", title: "Contact", priority: 0.3, tags: ["contact"] },
    ];

    for (const s of staticPages) {
        pages.push({
            url: `${baseUrl}${s.path}`,
            path: s.path,
            type: s.path === "/" ? "home" : "other",
            title: s.title,
            description: null,
            locale: null,
            updatedAt: new Date(),
            priority: s.priority,
            tags: s.tags,
        });
        // Add BG versions too as they are reachable
        pages.push({
            url: `${baseUrl}/bg${s.path === "/" ? "" : s.path}`,
            path: `/bg${s.path === "/" ? "" : s.path}`,
            type: s.path === "/" ? "home" : "other",
            title: s.title,
            description: null,
            locale: "bg",
            updatedAt: new Date(),
            priority: s.priority,
            tags: s.tags,
        });
    }

    // 2. Products
    try {
        const productsResult = await query(`
            SELECT 
                p.title, p.name, p.slug, p.description, p.tags, p.product_type, p.updated_at, p.brand, p.subtitle,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'
        `);
        for (const p of productsResult.rows) {
            const rawTitle = p.title || p.name;
            const brand = p.brand || "Slingshot";
            const category = p.category_name || p.product_type || "";

            // "Brand Category Name"
            const enrichedTitle = `${brand} ${category} ${rawTitle}`.replace(/\s+/g, " ").trim();

            // "Buy Brand Category Name - Subtitle"
            let enrichedDescription = `Buy ${enrichedTitle}`;
            if (p.subtitle) {
                enrichedDescription += ` - ${p.subtitle}`;
            } else if (p.description) {
                enrichedDescription += ` - ${p.description.slice(0, 160)}`;
            }

            pages.push({
                url: `${baseUrl}/product/${p.slug}`,
                path: `/product/${p.slug}`,
                type: "product",
                title: enrichedTitle,
                description: enrichedDescription,
                locale: null,
                updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
                priority: 0.9,
                tags: p.tags ? [p.product_type, brand, ...p.tags].filter(Boolean) : [p.product_type, brand].filter(Boolean),
            });
            // Add BG version
            pages.push({
                url: `${baseUrl}/bg/product/${p.slug}`,
                path: `/bg/product/${p.slug}`,
                type: "product",
                title: enrichedTitle,
                description: enrichedDescription,
                locale: "bg",
                updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
                priority: 0.9,
                tags: p.tags ? [p.product_type, brand, ...p.tags].filter(Boolean) : [p.product_type, brand].filter(Boolean),
            });
        }
    } catch (e) {
        console.warn("Failed to fetch products for inventory", e);
    }

    // 3. Collections
    try {
        const collectionsResult = await query(`
            SELECT DISTINCT c.title, c.slug, c.description, c.updated_at,
                   (SELECT count(*) FROM collection_products cp 
                    JOIN products p ON cp.product_id = p.id 
                    JOIN product_variants pv ON pv.product_id = p.id
                    WHERE cp.collection_id = c.id AND p.status = 'active' AND pv.inventory_quantity > 0) as stock_count
            FROM collections c
            INNER JOIN menu_group_collections mgc ON c.id = mgc.collection_id
            WHERE c.visible = true
            GROUP BY c.id
        `);
        for (const c of collectionsResult.rows) {
            const stockCount = Number(c.stock_count || 0);
            if (stockCount === 0) continue; // Skip empty/inactive collections

            pages.push({
                url: `${baseUrl}/collections/${c.slug}`,
                path: `/collections/${c.slug}`,
                type: "collection",
                title: c.title,
                description: c.description?.slice(0, 200) || `Browse ${c.title}`,
                locale: null,
                updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
                priority: 0.8,
                tags: ["collection"],
            });
            pages.push({
                url: `${baseUrl}/bg/collections/${c.slug}`,
                path: `/bg/collections/${c.slug}`,
                type: "collection",
                title: c.title,
                description: c.description?.slice(0, 200) || `Browse ${c.title}`,
                locale: "bg",
                updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
                priority: 0.8,
                tags: ["collection"],
            });
        }
    } catch (e) {
        console.warn("Failed to fetch collections for inventory", e);
    }

    // 4. Articles
    try {
        const blogsResult = await query("SELECT title, slug, excerpt, published_at FROM blog_posts WHERE published_at IS NOT NULL");
        for (const a of blogsResult.rows) {
            pages.push({
                url: `${baseUrl}/blog/${a.slug}`,
                path: `/blog/${a.slug}`,
                type: "article",
                title: a.title,
                description: a.excerpt,
                locale: null,
                updatedAt: a.published_at ? new Date(a.published_at) : new Date(),
                priority: 0.7,
                tags: ["blog"],
            });
        }
    } catch (e) {
        // Silent or small warn as these might not exist yet
    }

    // 5. CMS Pages
    try {
        const cmsResult = await query("SELECT title, slug, published_at FROM cms_pages WHERE published_at IS NOT NULL");
        for (const p of cmsResult.rows) {
            pages.push({
                url: `${baseUrl}/page/${p.slug}`,
                path: `/page/${p.slug}`,
                type: "other",
                title: p.title,
                description: null,
                locale: null,
                updatedAt: p.published_at ? new Date(p.published_at) : new Date(),
                priority: 0.5,
                tags: ["page"],
            });
        }
    } catch (e) {
        // Silent
    }

    const inventory: InventoryData = {
        site: {
            name: aiVisibilityConfig.siteName,
            baseUrl: baseUrl,
            defaultLocale: aiVisibilityConfig.defaultLocale,
            locales: aiVisibilityConfig.locales,
        },
        generatedAt: new Date(),
        pages,
        important: {
            primary: [
                `${baseUrl}/`,
                `${baseUrl}/shop`,
            ],
            help: [
                `${baseUrl}/inquiry/contact`,
            ],
            legal: [
                aiVisibilityConfig.policyUrls.privacy,
                aiVisibilityConfig.policyUrls.terms,
            ].filter(Boolean) as string[],
            sitemap: `${baseUrl}/sitemap.xml`,
            robots: `${baseUrl}/robots.txt`,
        },
    };

    // Update cache
    inventoryCache = {
        data: inventory,
        expiresAt: now + aiVisibilityConfig.cacheTtlSeconds * 1000,
    };

    return inventory;
}
