import { getInventory } from "./inventory";

export async function renderLlmsFullStream() {
    // For now, we will just generate the full string and return it.
    // In a true large-scale scenario, we would iterate and yield chunks.
    // Given the likely size of this shop (<10k items), string generation is fine for now,
    // but we structure it to be easily switchable to a stream.

    const inventory = await getInventory();
    const { site, pages } = inventory;

    let output = "";

    output += `# ${site.name} (Full Inventory)\n\n`;

    // Group by type
    const byType: Record<string, typeof pages> = {};
    for (const p of pages) {
        const t = p.type;
        if (!byType[t]) byType[t] = [];
        byType[t].push(p);
    }

    const typeOrder = ["home", "collection", "product", "article", "category", "faq", "legal", "other"];

    for (const type of typeOrder) {
        const group = byType[type];
        if (!group || group.length === 0) continue;

        output += `## ${type.toUpperCase()}\n`;
        for (const page of group) {
            output += `- [${page.title}](${page.url})\n`;
        }
        output += "\n";
    }

    // Catch-all for any types not in specific order
    for (const type of Object.keys(byType)) {
        if (!typeOrder.includes(type)) {
            const group = byType[type];
            output += `## ${type.toUpperCase()}\n`;
            for (const page of group) {
                output += `- [${page.title}](${page.url})\n`;
            }
            output += "\n";
        }
    }

    return output;
}
