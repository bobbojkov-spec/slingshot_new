import { InventoryPage } from "./inventory";
import { aiVisibilityConfig } from "./config";

export function generateAiSnippet(page: InventoryPage, style: "minimal" | "boxed" = "minimal") {
    const containerStyle = style === "boxed"
        ? "border: 1px solid #eee; padding: 1rem; margin: 1rem 0; font-size: 0.9rem; color: #555;"
        : "margin: 0.5rem 0; font-size: 0.85rem; color: #666;";

    const brandName = aiVisibilityConfig.siteName;

    return `
    <div class="ai-overview-snippet" style="${containerStyle}">
        <strong>AI Summary for ${brandName}:</strong> ${page.description || page.title}
        ${page.tags && page.tags.length > 0 ? `<br/><small>Topics: ${page.tags.join(", ")}</small>` : ""}
    </div>
    `;
}
