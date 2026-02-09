import { InventoryData, getInventory } from "./inventory";
import { aiVisibilityConfig } from "./config";

export async function renderLlmsShort(): Promise<string> {
    const inventory = await getInventory(); // Uses cache automatically
    const { site, pages, important } = inventory;

    const lines: string[] = [];

    // Header
    lines.push(`# ${site.name}`);
    lines.push(`> ${pages.find((p) => p.type === "home")?.description || "Official Site"}`);
    lines.push("");

    // Primary
    lines.push("## Primary");
    for (const url of important.primary) {
        const page = pages.find((p) => p.url === url);
        lines.push(`- [${page?.title || "Home"}](${url})`);
    }
    lines.push("");

    // Key Content (top products/collections)
    lines.push("## Key Content");

    const keyContentLimit = aiVisibilityConfig.llmsShortMaxLinks;

    // 1. Filter out primary links and home
    let filtered = pages.filter(p => p.type !== "home" && !important.primary.includes(p.url));

    // 2. De-duplicate by base path (normalize /bg/)
    // We want only one version in the short summary
    const seenBasePaths = new Set<string>();
    const deduplicated: typeof pages = [];

    for (const p of filtered) {
        const basePath = p.path.replace(/^\/bg(\/|$)/, "/");
        if (seenBasePaths.has(basePath)) continue;

        // Prefer English (locale === null) if possible, but first come first served works too
        // Since we sort by priority desc next, it's safer to check existence
        deduplicated.push(p);
        seenBasePaths.add(basePath);
    }

    // 3. Sort by: Type (Category first) desc, isFeatured desc, priority desc, date desc
    const sortedPages = deduplicated.sort((a, b) => {
        // Absolute top: Categories
        if (a.type === "category" && b.type !== "category") return -1;
        if (a.type !== "category" && b.type === "category") return 1;

        // Next: isFeatured
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        const pDelta = (b.priority || 0.5) - (a.priority || 0.5);
        if (pDelta !== 0) return pDelta;

        return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
    });

    let count = 0;
    for (const page of sortedPages) {
        if (count >= keyContentLimit) break;
        lines.push(`- [${page.title}](${page.url}) ${page.description ? `- ${page.description}` : ""}`);
        count++;
    }
    lines.push("");

    // Help & Legal
    if (important.help.length > 0) {
        lines.push("## Help");
        important.help.forEach(url => lines.push(`- ${url}`));
        lines.push("");
    }
    if (important.legal.length > 0) {
        lines.push("## Legal");
        important.legal.forEach(url => lines.push(`- ${url}`));
        lines.push("");
    }

    // Machine Discovery
    lines.push("## Machine-readable");
    if (important.sitemap) lines.push(`- Sitemap: ${important.sitemap}`);
    if (important.robots) lines.push(`- Robots: ${important.robots}`);
    lines.push("");

    // Notes
    lines.push("## Notes");
    lines.push("- Content is strictly for search/AI indexing.");
    lines.push("- Prices and availability subject to change.");
    if (site.locales && site.locales.length > 1) {
        lines.push(`- Supported locales: ${site.locales.join(", ")}`);
    }

    return lines.join("\n");
}
