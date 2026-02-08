import { generateAiSnippet } from "@/lib/ai-visibility/snippet";
import { InventoryPage } from "@/lib/ai-visibility/inventory";

interface AiVisibilitySnippetProps {
    page: Partial<InventoryPage>;
    style?: "minimal" | "boxed";
}

export default function AiVisibilitySnippet({ page, style }: AiVisibilitySnippetProps) {
    // Construct a safe partial inventory page object
    const inventoryPage: InventoryPage = {
        url: page.url || "",
        path: page.path || "",
        type: page.type || "other",
        title: page.title || "",
        description: page.description || "",
        locale: page.locale || null,
        updatedAt: page.updatedAt || new Date(),
        priority: page.priority || 0.5,
        tags: page.tags || [],
    };

    const html = generateAiSnippet(inventoryPage, style);

    return (
        <div
            dangerouslySetInnerHTML={{ __html: html }}
            className="print:hidden" // Optional: hide when printing if desired
        />
    );
}
