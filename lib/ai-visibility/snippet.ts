import { InventoryPage } from "./inventory";

export function generateAiSnippet(page: InventoryPage, style: "minimal" | "boxed" = "minimal") {
    // This generates a visual snippet HTML string that can be injected.
    // For SSR/Server Components, you would render this as a component (JSX).
    // This helper returns string for raw injection or for API use.

    // Minimal style:
    // <div data-ai-visible> ... </div>

    const containerStyle = style === "boxed"
        ? "border: 1px solid #eee; padding: 1rem; margin: 1rem 0; font-size: 0.9rem; color: #555;"
        : "margin: 0.5rem 0; font-size: 0.85rem; color: #666;";

    // We can add "hidden" or specific classes if we want it visible only to bots, 
    // BUT the prompt requirement says "visible (no display:none)".

    return `
    <div class="ai-overview-snippet" style="${containerStyle}">
        <strong>AI Summary:</strong> ${page.description || page.title}
        ${page.tags && page.tags.length > 0 ? `<br/><small>Tags: ${page.tags.join(", ")}</small>` : ""}
    </div>
    `;
}
