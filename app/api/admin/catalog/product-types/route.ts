import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const creates = Array.isArray(body?.creates) ? body.creates : [];
    const updates = Array.isArray(body?.updates) ? body.updates : [];
    const deletes = Array.isArray(body?.deletes) ? body.deletes : [];

    // First try the dedicated `product_types` table (preferred).
    // If it doesn't exist, fall back to bulk-updating `products.product_type`.
    const { error: existsError } = await supabaseAdmin
      .from("product_types")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    const missingTable =
      !!existsError &&
      String(existsError.message || "").includes("Could not find the table");

    if (!missingTable) {
      for (const d of deletes) {
        if (typeof d !== "string") continue;
        const { error } = await supabaseAdmin
          .from("product_types")
          .delete()
          .eq("id", d);
        if (error)
          return NextResponse.json({ error: error.message }, { status: 400 });
      }

      for (const row of creates) {
        const name = String(row?.name ?? "").trim();
        if (!name) continue;
        const { error } = await supabaseAdmin.from("product_types").insert({ name });
        if (error)
          return NextResponse.json({ error: error.message }, { status: 400 });
      }

      for (const row of updates) {
        const id = String(row?.id ?? "").trim();
        const name = String(row?.name ?? "").trim();
        if (!id || !name) continue;
        const { error } = await supabaseAdmin
          .from("product_types")
          .update({ name })
          .eq("id", id);
        if (error)
          return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("product_types")
        .select("id, name")
        .order("name");
      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({ productTypes: data || [] });
    }

    // Fallback mode: treat product types as the distinct values of `products.product_type`.
    if (creates.length > 0) {
      return NextResponse.json(
        { error: "Cannot create new product types without a `product_types` table." },
        { status: 400 },
      );
    }

    // Deletes: clear product_type on all matching products
    for (const d of deletes) {
      if (typeof d !== "string") continue;
      const oldVal = String(d).trim();
      if (!oldVal) continue;
      const { error } = await supabaseAdmin
        .from("products")
        .update({ product_type: null })
        .eq("product_type", oldVal);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Updates: rename old value -> new value across products
    for (const row of updates) {
      const oldVal = String(row?.id ?? "").trim(); // in fallback, `id` is the old type string
      const newVal = String(row?.name ?? "").trim();
      if (!oldVal || !newVal) continue;
      if (oldVal === newVal) continue;
      const { error } = await supabaseAdmin
        .from("products")
        .update({ product_type: newVal })
        .eq("product_type", oldVal);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: rows, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("product_type")
      .not("product_type", "is", null);
    if (prodErr)
      return NextResponse.json({ error: prodErr.message }, { status: 400 });

    const unique = Array.from(
      new Set(
        (rows || [])
          .map((r: any) => r.product_type)
          .filter((v: any) => typeof v === "string" && v.trim().length > 0),
      ),
    )
      .sort()
      .map((t) => ({ id: String(t), name: String(t) }));

    return NextResponse.json({ productTypes: unique });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 },
    );
  }
}


