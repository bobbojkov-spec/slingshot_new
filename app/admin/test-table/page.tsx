import { supabaseAdmin } from '@/lib/supabase/server';
import TestTableClient from './TestTableClient';

export const revalidate = 0;

export default async function TestTablePage() {
  // Fetch a broad set of products with categories (raise limit to include all)
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, title, product_type, tags, status, availability, updated_at, created_at, shopify_product_id, category:categories(name)')
    .order('created_at', { ascending: false })
    .limit(1000);

  const productIds = (products || []).map((p) => p.id);

  // Fetch images for these products
  const { data: images } = await supabaseAdmin
    .from('product_images')
    .select('id, product_id, url, position, shopify_product_id')
    .in('product_id', productIds)
    .order('position');

  // Fetch variants for these products
  const { data: variants } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .in('product_id', productIds);

  const imagesByProduct = new Map<string, any[]>();
  (images || []).forEach((img) => {
    const list = imagesByProduct.get(img.product_id) || [];
    list.push(img);
    imagesByProduct.set(img.product_id, list);
  });

  const variantsByProduct = new Map<string, any[]>();
  (variants || []).forEach((v) => {
    const list = variantsByProduct.get(v.product_id) || [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  });

  const assembled = (products || []).map((p) => {
    const category = Array.isArray(p.category) && p.category.length > 0 
      ? p.category[0] 
      : (Array.isArray(p.category) ? undefined : p.category);
    return {
      ...p,
      images: imagesByProduct.get(p.id) || [],
      variants: variantsByProduct.get(p.id) || [],
      imageCount: imagesByProduct.get(p.id)?.length || 0,
      category: category as { name?: string } | string | undefined,
    };
  });

  return <TestTableClient products={assembled} />;
}

