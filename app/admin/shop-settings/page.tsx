import { query } from '@/lib/db';
import { getKeyFromUrl, getPresignedUrl } from '@/lib/railway/storage';
import ShopSettingsClient from './ShopSettingsClient';

export const dynamic = 'force-dynamic';

type Collection = {
  id: string;
  title: string;
  slug: string;
  source: string;
  subtitle?: string;
};

type Tag = {
  name_en: string;
  name_bg: string | null;
  slug: string;
  count: number;
};

type Brand = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  sort_order: number;
  logo_url_signed?: string | null;
};

type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
};

export default async function ShopSettingsPage() {
  const collectionsResult = await query(`
    SELECT id, title, slug, source, subtitle
    FROM collections
    WHERE visible = true
    ORDER BY title ASC
  `);

  const selectedCollectionsResult = await query(`
    SELECT collection_id, sort_order
    FROM homepage_featured_collections
    ORDER BY sort_order ASC
  `);

  const tagsResult = await query(`
    SELECT
      t.name_en,
      t.name_bg,
      t.slug,
      (
        SELECT COUNT(DISTINCT p.id)
        FROM products p
        LEFT JOIN product_translations pt ON p.id = pt.product_id
        WHERE p.status = 'active' AND (
          t.name_en = ANY(p.tags) OR
          t.name_en = ANY(pt.tags)
        )
      ) as count
    FROM tags t
    ORDER BY count DESC, t.name_en ASC
  `);

  const selectedKeywordsResult = await query(`
    SELECT tag_name_en, sort_order
    FROM homepage_featured_keywords
    ORDER BY sort_order ASC
  `);

  const brandsResult = await query(`
    SELECT id, name, slug, logo_url, sort_order
    FROM shop_featured_brands
    ORDER BY sort_order ASC, name ASC
  `);

  const brands = await Promise.all(
    (brandsResult.rows as Brand[]).map(async (brand) => {
      if (!brand.logo_url) return { ...brand, logo_url_signed: null };
      try {
        const parsed = new URL(brand.logo_url);
        const [bucket, ...rest] = parsed.pathname.replace(/^\//, '').split('/');
        const key = rest.join('/') || getKeyFromUrl(brand.logo_url) || brand.logo_url;
        const signedUrl = await getPresignedUrl(key, bucket);
        return { ...brand, logo_url_signed: signedUrl };
      } catch (error) {
        return { ...brand, logo_url_signed: null };
      }
    })
  );

  const featuredCollectionResult = await query(
    `SELECT id FROM collections WHERE slug = $1 LIMIT 1`,
    ['featured-products']
  );
  const featuredCollectionId = featuredCollectionResult.rows[0]?.id;

  let featuredProducts: FeaturedProduct[] = [];
  if (featuredCollectionId) {
    const featuredProductsResult = await query(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        (
          SELECT storage_path 
          FROM product_images_railway 
          WHERE product_id = p.id AND size = 'thumb' 
          ORDER BY display_order ASC 
          LIMIT 1
        ) as storage_path
      FROM products p
      INNER JOIN collection_products cp ON cp.product_id = p.id
      WHERE cp.collection_id = $1
      ORDER BY cp.sort_order ASC, p.name ASC`,
      [featuredCollectionId]
    );

    featuredProducts = await Promise.all(
      featuredProductsResult.rows.map(async (row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        thumbnail_url: row.storage_path ? await getPresignedUrl(row.storage_path) : null,
      }))
    );
  }

  return (
    <ShopSettingsClient
      allCollections={collectionsResult.rows as Collection[]}
      initialSelectedCollectionIds={selectedCollectionsResult.rows.map((r: any) => r.collection_id)}
      allTags={tagsResult.rows as Tag[]}
      initialSelectedTagNames={selectedKeywordsResult.rows.map((r: any) => r.tag_name_en)}
      initialBrands={brands}
      featuredProducts={featuredProducts}
      featuredCollectionId={featuredCollectionId || null}
    />
  );
}