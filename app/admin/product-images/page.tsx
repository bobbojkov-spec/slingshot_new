import ProductImagesAdminClient from './ProductImagesAdminClient';

const DEFAULT_PRODUCT_ID = '899c74c5-fff8-4845-b71f-d01644140617';

export const revalidate = 0;

export default function ProductImagesPage() {
  return (
    <div style={{ width: '100%' }}>
      <ProductImagesAdminClient productId={DEFAULT_PRODUCT_ID} />
    </div>
  );
}

