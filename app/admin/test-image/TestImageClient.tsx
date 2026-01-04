'use client';

import { Alert, Card, Image, Space, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

type ProductData = {
  id: string;
  title: string;
  shopify_product_id: string | null;
} | null;

type ImageData = {
  id: string;
  url: string;
  position: number;
  shopify_product_id: string | null;
};

export default function TestImageClient({
  product,
  images,
  error,
}: {
  product: ProductData;
  images: ImageData[];
  error: string | null;
}) {
  if (error) {
    return <Alert title="Error loading test data" description={error} type="error" showIcon />;
  }

  if (!product) {
    return <Alert title="Product not found" type="warning" showIcon />;
  }

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Test Image Display">
        <Title level={4}>{product.title}</Title>
        <Text type="secondary">Product ID: {product.id}</Text>
        <br />
        <Text type="secondary">Shopify Product ID: {product.shopify_product_id || 'N/A'}</Text>
        <br />
        <Text type="secondary">Total images: {images.length}</Text>
      </Card>

      {images.length === 0 && <Alert title="No images found for this product" type="info" showIcon />}

      {images.map((img, idx) => (
        <Card
          key={img.id}
          title={`Image ${idx + 1} (Position ${img.position})`}
          extra={<Tag color="blue">ID: {img.id}</Tag>}
        >
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>URL:</Text>
              <br />
              <Text copyable style={{ fontSize: 12 }}>
                {img.url}
              </Text>
            </div>

            <div>
              <Text strong>Thumbnail (100x100):</Text>
              <br />
              <Image
                src={img.url}
                alt={`${product.title} - Image ${idx + 1}`}
                width={100}
                height={100}
                style={{ objectFit: 'cover', border: '1px solid #d9d9d9' }}
                placeholder
              />
            </div>

            <div>
              <Text strong>Medium (400x400):</Text>
              <br />
              <Image
                src={img.url}
                alt={`${product.title} - Image ${idx + 1}`}
                width={400}
                height={400}
                style={{ objectFit: 'cover', border: '1px solid #d9d9d9' }}
                placeholder
              />
            </div>
          </Space>
        </Card>
      ))}
    </Space>
  );
}

