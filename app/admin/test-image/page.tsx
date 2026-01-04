import { supabaseAdmin } from '@/lib/supabase/server';
import TestImageClient from './TestImageClient';
import TestTableClient from '../test-table/TestTableClient';

export const revalidate = 0;

export default async function TestImagePage() {
  // Fetch Javelin product images
  const productId = 'ad9e80ad-37f3-40e9-a2cc-b6bc45ba90d6';

  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, title, product_type, tags, status, availability, updated_at, created_at, shopify_product_id')
    .eq('id', productId)
    .single();

  const { data: images, error: imagesError } = await supabaseAdmin
    .from('product_images')
    .select('id, url, position, shopify_product_id')
    .eq('product_id', productId)
    .order('position');

  const { data: variants } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .eq('product_id', productId);

  const tableProducts = product
    ? [
        {
          ...product,
          images: images || [],
          variants: variants || [],
          imageCount: images?.length || 0,
        },
      ]
    : [];

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <TestTableClient products={tableProducts} />
      </div>
      <TestImageClient
        product={product || null}
        images={images || []}
        error={productError?.message || imagesError?.message || null}
      />
    </>
  );
}

