import { generateAiSnippet } from "@/lib/ai-visibility/snippet";
import { InventoryPage } from "@/lib/ai-visibility/inventory";
import { generateJsonLd } from "@/lib/ai-visibility/schema";
import SchemaJsonLd from "./SchemaJsonLd";

interface AiVisibilitySnippetProps {
    page: Partial<InventoryPage>;
    data?: any; // Extra data for schema (like price, sku)
    style?: "minimal" | "boxed";
}

export default function AiVisibilitySnippet({ page, data, style }: AiVisibilitySnippetProps) {
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
    const schema = generateJsonLd(inventoryPage, data);

    return (
        <>
            {Array.isArray(schema) ? (
                schema.map((s, i) => <SchemaJsonLd key={i} data={s as any} />)
            ) : (
                <SchemaJsonLd data={schema as any} />
            )}
            <div
                dangerouslySetInnerHTML={{ __html: html }}
                className="sr-only print:hidden"
            />
        </>
    );
}
