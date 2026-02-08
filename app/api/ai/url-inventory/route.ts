import { getInventory } from "@/lib/ai-visibility/inventory";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("fresh") === "1";

    // Potentially check for a secret header if forceRefresh is strictly internal
    // const authHeader = request.headers.get("x-inventory-secret");
    // if (forceRefresh && authHeader !== process.env.INVENTORY_SECRET) {
    //    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const inventory = await getInventory({ forceRefresh });

    return NextResponse.json(inventory, {
        headers: {
            "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=600",
        },
    });
}
