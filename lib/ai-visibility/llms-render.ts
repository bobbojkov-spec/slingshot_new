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
    // Simple heuristic: take top priority items, limited count
    lines.push("## Key Content");

    // Sort by priority desc, then date desc
    const sortedPages = [...pages].sort((a, b) => {
        const pCurrent = (b.priority || 0.5) - (a.priority || 0.5);
        if (pCurrent !== 0) return pCurrent;
        return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
    });

    const keyContentLimit = aiVisibilityConfig.llmsShortMaxLinks;
    let count = 0;

    for (const page of sortedPages) {
        // Skip home and primary links to avoid dupe, broadly speaking
        if (page.type === "home") continue;
        if (important.primary.includes(page.url)) continue;

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
