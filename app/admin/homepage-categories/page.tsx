import { query } from '@/lib/db';
import HomepageCategoriesClient from './HomepageCategoriesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop by CAT - Admin',
};

type Collection = {
  id: string;
  title: string;
  slug: string;
  source: string;
  subtitle?: string;
};

export default async function HomepageCategoriesPage() {
  // Fetch all collections (both slingshot and rideengine)
  const collectionsResult = await query(`
        SELECT id, title, slug, source, subtitle
        FROM collections
        WHERE visible = true
        ORDER BY title ASC
    `);

  // Fetch currently selected collections
  const selectedResult = await query(`
        SELECT collection_id, sort_order
        FROM homepage_featured_collections
        ORDER BY sort_order ASC
    `);

  const allCollections: Collection[] = collectionsResult.rows;
  const selectedIds: string[] = selectedResult.rows.map((r: any) => r.collection_id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Shop by Top Categories</h1>
      <p className="text-gray-500 mb-6">
        Select up to 8+ collections. Only the first 8 will be displayed on the homepage.
        Drag to reorder.
      </p>
      <HomepageCategoriesClient
        allCollections={allCollections}
        initialSelectedIds={selectedIds}
      />
    </div>
  );
}
