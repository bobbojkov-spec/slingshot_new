import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { resolveBaseUrl } from "@/lib/seo/url-server";

const withBg = (baseUrl: string, path: string) => `${baseUrl}/bg${path === "/" ? "" : path}`;

const buildStaticEntries = (baseUrl: string): MetadataRoute.Sitemap => {
    const entries = [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/shop`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
        },
        {
            url: `${baseUrl}/inquiry/summary`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/inquiry/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/inquiry/success`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.2,
        },
        {
            url: `${baseUrl}/slingshot-collections`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/rideengine-collections`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
    ];

    return [
        ...entries,
        ...entries.map((entry) => ({
            ...entry,
            url: withBg(baseUrl, entry.url.replace(baseUrl, "")),
        })),
    ];
};

const fetchProductEntries = async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
    try {
        const productsSql = `
      SELECT slug, updated_at
      FROM products
      WHERE status = 'active'
      ORDER BY updated_at DESC NULLS LAST
    `;
        const result = await query(productsSql);
        const entries = result.rows
            .filter((row: { slug?: string | null }) => Boolean(row.slug))
            .map((row: { slug: string; updated_at?: string | Date | null }) => ({
                url: `${baseUrl}/product/${row.slug}`,
                lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
                changeFrequency: "weekly",
                priority: 0.8,
            }));

        return [
            ...entries,
            ...entries.map((entry) => ({
                ...entry,
                url: withBg(baseUrl, entry.url.replace(baseUrl, "")),
            })),
        ];
    } catch (error) {
        console.warn("[sitemap] Failed to load product URLs", error);
        return [];
    }
};

const fetchCategoryEntries = async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
    try {
        const categorySql = `
      SELECT slug, updated_at
      FROM categories
      WHERE status = 'active' AND slug IS NOT NULL
      ORDER BY updated_at DESC NULLS LAST
    `;
        const result = await query(categorySql);
        const entries = result.rows.map((row: { slug: string; updated_at?: string | Date | null }) => ({
            url: `${baseUrl}/category/${row.slug}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        }));

        return [
            ...entries,
            ...entries.map((entry) => ({
                ...entry,
                url: withBg(baseUrl, entry.url.replace(baseUrl, "")),
            })),
        ];
    } catch (error) {
        console.warn("[sitemap] Failed to load category URLs", error);
        return [];
    }
};

const fetchCollectionEntries = async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
    try {
        const collectionsSql = `
      SELECT slug, updated_at
      FROM collections
      WHERE visible = true AND slug IS NOT NULL
      ORDER BY updated_at DESC NULLS LAST
    `;
        const result = await query(collectionsSql);
        const entries = result.rows.map((row: { slug: string; updated_at?: string | Date | null }) => ({
            url: `${baseUrl}/collections/${row.slug}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        }));

        return [
            ...entries,
            ...entries.map((entry) => ({
                ...entry,
                url: withBg(baseUrl, entry.url.replace(baseUrl, "")),
            })),
        ];
    } catch (error) {
        console.warn("[sitemap] Failed to load collection URLs", error);
        return [];
    }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = (await resolveBaseUrl()).replace(/\/$/, "");
    const [products, categories, collections] = await Promise.all([
        fetchProductEntries(baseUrl),
        fetchCategoryEntries(baseUrl),
        fetchCollectionEntries(baseUrl),
    ]);

    return [
        ...buildStaticEntries(baseUrl),
        ...products,
        ...categories,
        ...collections,
    ];
}