import { renderLlmsShort } from "@/lib/ai-visibility/llms-render";

export async function GET() {
    const content = await renderLlmsShort();

    return new Response(content, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=600",
        },
    });
}