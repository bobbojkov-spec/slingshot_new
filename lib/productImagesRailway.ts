import { query } from '@/lib/db';

export const PRODUCT_IMAGES_RAILWAY_TABLE = 'product_images_railway';
export const RAILWAY_PROVIDER = 'railway';
export type ImageSize = 'thumb' | 'small' | 'big';

export type ProductImageRecord = {
  id: string;
  bundle_id: string;
  product_id: string;
  image_url: string;
  storage_path: string;
  size: ImageSize;
  display_order: number;
  created_at: string | Date | null;
};

export type ProductImageBundle = {
  bundleId: string;
  productId: string;
  order: number;
  createdAt: string | null;
  urls: Record<ImageSize, { url: string; path: string } | null>;
};

const TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${PRODUCT_IMAGES_RAILWAY_TABLE} (
    id UUID PRIMARY KEY,
    bundle_id UUID NOT NULL,
    product_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    size TEXT NOT NULL CHECK (size IN ('big', 'small', 'thumb')),
    display_order INT NOT NULL DEFAULT 0,
    storage_provider TEXT NOT NULL DEFAULT '${RAILWAY_PROVIDER}',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS ${PRODUCT_IMAGES_RAILWAY_TABLE}_bundle_size_idx
    ON ${PRODUCT_IMAGES_RAILWAY_TABLE} (bundle_id, size);
  CREATE INDEX IF NOT EXISTS ${PRODUCT_IMAGES_RAILWAY_TABLE}_product_order_idx
    ON ${PRODUCT_IMAGES_RAILWAY_TABLE} (product_id, display_order);
`;

export async function ensureProductImagesRailwayTable() {
  await query(TABLE_SQL);
}

