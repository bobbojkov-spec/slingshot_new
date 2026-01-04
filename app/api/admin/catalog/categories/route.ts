import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const creates = Array.isArray(body?.creates) ? body.creates : [];
    const updates = Array.isArray(body?.updates) ? body.updates : [];
    const deletes = Array.isArray(body?.deletes) ? body.deletes : [];

    for (const d of deletes) {
      if (typeof d !== "string") continue;
      const { error } = await supabaseAdmin.from("categories").delete().eq("id", d);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    for (const row of creates) {
      const name = String(row?.name ?? "").trim();
      if (!name) continue;
      const slug = slugify(name);
      const { error } = await supabaseAdmin
        .from("categories")
        .insert({ name, slug, handle: slug })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    for (const row of updates) {
      const id = String(row?.id ?? "").trim();
      const name = String(row?.name ?? "").trim();
      if (!id || !name) continue;
      const slug = slugify(name);
      const { error } = await supabaseAdmin
        .from("categories")
        .update({ name, slug, handle: slug })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ categories: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 },
    );
  }
}


