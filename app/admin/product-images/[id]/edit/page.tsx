import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import ProductImagesAdminClient from '../../ProductImagesAdminClient';

export const revalidate = 0;

export default async function ProductImagesEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const productId = resolvedParams?.id;
  if (!productId) {
    notFound();
  }

  const { rows } = await query(
    `
      SELECT id, title, name
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const product = rows?.[0];
  if (!product) {
    notFound();
  }

  const productTitle = product.title || product.name || 'Product';

  return (
    <div style={{ width: '100%' }}>
      <ProductImagesAdminClient productId={productId} initialProductTitle={productTitle} />
    </div>
  );
}


