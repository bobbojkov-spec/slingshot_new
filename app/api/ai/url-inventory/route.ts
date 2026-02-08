import { getInventory } from "@/lib/ai-visibility/inventory";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get("fresh") === "1";

        const inventory = await getInventory({ forceRefresh });

        return NextResponse.json(inventory, {
            headers: {
                "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=600",
            },
        });
    } catch (error) {
        console.error("[api/ai/url-inventory] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
