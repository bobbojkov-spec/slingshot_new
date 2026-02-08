import { renderLlmsFullStream } from "@/lib/ai-visibility/llms-stream";

export async function GET() {
    // In a real high-scale scenario, we would pipe a stream here.
    // For now, we await the string generator.
    const content = await renderLlmsFullStream();

    return new Response(content, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            // Longer cache for full inventory (expensive)
            "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
        },
    });
}
