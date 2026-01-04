import CategoriesClient from "./CategoriesClient";
import { supabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 0;

async function fetchCategories() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  return (data || []).map((r: any) => ({ id: String(r.id), name: String(r.name ?? "") }));
}

async function fetchProductTypes() {
  // Preferred: a dedicated table you can manage.
  // Fallback: if it doesn't exist, derive distinct product types from `products.product_type`.
  const { data, error } = await supabaseAdmin
    .from("product_types")
    .select("id, name")
    .order("name");

  if (error) {
    const msg = String(error.message || "");
    if (msg.includes("Could not find the table") || msg.includes("product_types")) {
      const { data: rows, error: prodErr } = await supabaseAdmin
        .from("products")
        .select("product_type")
        .not("product_type", "is", null);
      if (prodErr) throw new Error(prodErr.message);

      const unique = Array.from(
        new Set(
          (rows || [])
            .map((r: any) => r.product_type)
            .filter((v: any) => typeof v === "string" && v.trim().length > 0),
        ),
      ).sort();

      return {
        productTypes: unique.map((t) => ({ id: t, name: t })),
        // Editable/deletable is supported via bulk updates on `products.product_type`.
        // Creating new product types still requires a dedicated table.
        writable: true,
        creatable: false,
      };
    }
    throw new Error(msg);
  }

  return {
    productTypes: (data || []).map((r: any) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
    })),
    writable: true,
    creatable: true,
  };
}

export default async function AdminCategoriesPage() {
  const [categories, pt] = await Promise.all([fetchCategories(), fetchProductTypes()]);
  return (
    <CategoriesClient
      initialCategories={categories}
      initialProductTypes={pt.productTypes}
      productTypesWritable={pt.writable}
      productTypesCreatable={pt.creatable}
    />
  );
}

