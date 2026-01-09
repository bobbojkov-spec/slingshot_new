import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { deletePublicImage, getProxyUrl } from '@/lib/railway/storage';
import {
  ensureProductImagesRailwayTable,
  ImageSize,
  PRODUCT_IMAGES_RAILWAY_TABLE,
  ProductImageBundle,
  ProductImageRecord,
  RAILWAY_PROVIDER,
} from '@/lib/productImagesRailway';

type NormalizedBundle = Omit<ProductImageBundle, 'createdAt'> & {
  createdAt: string | null;
};

const normalizeCreatedAt = (value: ProductImageRecord['created_at']): string | null =>
  value ? new Date(value).toISOString() : null;

const initializeBundle = (record: ProductImageRecord): NormalizedBundle => ({
  bundleId: record.bundle_id,
  productId: record.product_id,
  order: record.display_order,
  createdAt: normalizeCreatedAt(record.created_at),
  urls: {
    thumb: null,
    small: null,
    big: null,
  },
});

const buildBundles = async (rows: ProductImageRecord[]): Promise<ProductImageBundle[]> => {
  const map = new Map<string, NormalizedBundle>();
  for (const row of rows) {
    const key = row.bundle_id;
    const existing = map.get(key) ?? initializeBundle(row);
    existing.order = Math.min(existing.order, row.display_order);
    const createdAt = normalizeCreatedAt(row.created_at);
    existing.createdAt = existing.createdAt || createdAt;
    const signedUrl = row.storage_path ? getProxyUrl(row.storage_path) : null;
    existing.urls[row.size] = signedUrl ? { url: signedUrl, path: row.storage_path } : null;
    map.set(key, existing);
  }

  const sortedBundles = Array.from(map.values()).sort((a, b) => {
    if (a.order === b.order) {
      return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    }
    return a.order - b.order;
  });
  return sortedBundles as ProductImageBundle[];
};

async function fetchBundles(productId: string) {
  const { rows } = await query(
    `
      SELECT
        id,
        bundle_id,
        product_id,
        image_url,
        storage_path,
        size,
        display_order,
        created_at
      FROM ${PRODUCT_IMAGES_RAILWAY_TABLE}
      WHERE product_id = $1
        AND storage_provider = $2
        AND image_url NOT LIKE '%supabase.co%'
      ORDER BY display_order ASC, bundle_id ASC
    `,
    [productId, RAILWAY_PROVIDER]
  );
  return buildBundles(rows as ProductImageRecord[]);
}

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    await ensureProductImagesRailwayTable();
    const bundles = await fetchBundles(productId);
    return NextResponse.json({ bundles });
  } catch (error: any) {
    console.error('Failed to load product images', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load product images' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = body?.productId;
    const bundles = Array.isArray(body?.bundles) ? body.bundles : [];

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    await ensureProductImagesRailwayTable();

    for (const bundle of bundles) {
      if (!bundle?.bundleId || typeof bundle.order !== 'number') continue;
      await query(
        `
          UPDATE ${PRODUCT_IMAGES_RAILWAY_TABLE}
          SET display_order = $1,
              updated_at = NOW()
          WHERE bundle_id = $2 AND storage_provider = $3
        `,
        [bundle.order, bundle.bundleId, RAILWAY_PROVIDER]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to reorder product images', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const bundleId = body?.bundleId;
    if (!bundleId) {
      return NextResponse.json({ error: 'bundleId is required' }, { status: 400 });
    }

    await ensureProductImagesRailwayTable();

    const { rows } = await query(
      `
        SELECT storage_path
        FROM ${PRODUCT_IMAGES_RAILWAY_TABLE}
        WHERE bundle_id = $1 AND storage_provider = $2
      `,
      [bundleId, RAILWAY_PROVIDER]
    );

    await query(
      `
        DELETE FROM ${PRODUCT_IMAGES_RAILWAY_TABLE}
        WHERE bundle_id = $1 AND storage_provider = $2
      `,
      [bundleId, RAILWAY_PROVIDER]
    );

    const storageRows = rows as { storage_path: string }[];
    const paths = storageRows.map((row) => row.storage_path).filter(Boolean);
    await Promise.all(
      paths.map((path) =>
        deletePublicImage(path).catch((err) =>
          console.warn('Failed to delete bucket file', err)
        )
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product image bundle', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}

