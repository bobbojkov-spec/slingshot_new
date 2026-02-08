export const aiVisibilityConfig = {
    siteName: "Slingshot Bulgaria",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://slingshot-bg.com",
    defaultLocale: "bg",
    locales: ["bg", "en"],
    logoUrl: "https://slingshot-bg.com/logo.png", // Update if you have a specific logo URL
    socialProfiles: [
        "https://www.facebook.com/slingshotkiteboardingbulgaria",
        "https://www.instagram.com/slingshotbg/",
    ],
    contactUrl: "https://slingshot-bg.com/inquiry/contact",
    aboutUrl: "https://slingshot-bg.com/about", // Update if exists
    policyUrls: {
        privacy: "https://slingshot-bg.com/privacy", // Update if exists
        terms: "https://slingshot-bg.com/terms", // Update if exists
        // shipping: "...",
        // returns: "...",
    },
    inventorySource: "db" as const, // 'db' | 'sitemap' | 'routes' | 'auto'
    cacheTtlSeconds: 120,
    llmsShortMaxLinks: 12,
    llmsFullPageSize: 1000,
    streamTimeoutMs: 15000,
    localeStrategy: "query" as const, // 'path-prefix' | 'subdomain' | 'query' | 'mixed-single-url'
    // For query strategy, we might strictly technically have the same root, but logic handles ?lang=
    localeRoots: {
        bg: "https://slingshot-bg.com",
        en: "https://slingshot-bg.com",
    },
};
