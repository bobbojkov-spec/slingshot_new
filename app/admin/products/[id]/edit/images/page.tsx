import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { getImageVariantUrl } from '@/lib/utils/imagePaths';
import ProductImagesEditor from './ProductImagesEditor';

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ProductImagesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const productId = params?.id;
  if (!productId) {
    notFound();
  }

  const { rows: productRows } = await query(
    `
      SELECT id, title, name
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const product = productRows?.[0];
  if (!product) {
    notFound();
  }

  const { rows: imageRows } = await query(
    `
      SELECT id, product_id, url, position, sort_order, shopify_product_id
      FROM product_images
      WHERE product_id = $1
      ORDER BY COALESCE(position, sort_order, 9999)
    `,
    [productId]
  );

  const images = imageRows.map((row: any) => ({
    ...row,
    thumb_url: getImageVariantUrl(row.url, 'thumb') || row.url,
    medium_url: getImageVariantUrl(row.url, 'medium') || row.url,
  }));

  const paramsArray = Object.entries(searchParams || {})
    .flatMap(([key, value]) => {
      if (value === undefined) return [];
      if (Array.isArray(value)) {
        return value.map((val) => [key, val]);
      }
      return [[key, value]];
    });
  const qs = new URLSearchParams(paramsArray).toString();
  const backLink = qs ? `/admin/products?${qs}` : '/admin/products';

  return (
    <ProductImagesEditor
      productId={productId}
      productTitle={product.title || product.name || 'Product'}
      initialImages={images}
      backLink={backLink}
    />
  );
}

