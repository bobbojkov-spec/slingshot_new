import { query } from '@/lib/db';

const BADGE_COLLECTIONS = {
  'best-sellers': { en: 'Best Seller', bg: 'Най-продаван' },
  'new-products': { en: 'New Product', bg: 'Нов продукт' }
};

/**
 * Get badges for a product based on its collection membership
 * Returns array of badges (can have multiple: e.g., both "New" and "Best Seller")
 */
export async function getProductBadges(productId: string, language: 'en' | 'bg' = 'en'): Promise<string[]> {
  try {
    const result = await query(
      `SELECT c.slug 
       FROM collection_products cp
       JOIN collections c ON c.id = cp.collection_id
       WHERE cp.product_id = $1 
       AND c.slug IN ('best-sellers', 'new-products')
       AND c.visible = true`,
      [productId]
    );

    const badges: string[] = [];
    for (const row of result.rows) {
      const collectionSlug = row.slug as keyof typeof BADGE_COLLECTIONS;
      if (BADGE_COLLECTIONS[collectionSlug]) {
        badges.push(BADGE_COLLECTIONS[collectionSlug][language]);
      }
    }

    return badges;
  } catch (error) {
    console.error('Error fetching product badges:', error);
    return [];
  }
}

/**
 * Get badges for multiple products at once (more efficient)
 */
export async function getProductsBadges(productIds: string[], language: 'en' | 'bg' = 'en'): Promise<Map<string, string[]>> {
  if (productIds.length === 0) return new Map();

  try {
    const result = await query(
      `SELECT cp.product_id, c.slug 
       FROM collection_products cp
       JOIN collections c ON c.id = cp.collection_id
       WHERE cp.product_id = ANY($1::uuid[])
       AND c.slug IN ('best-sellers', 'new-products')
       AND c.visible = true`,
      [productIds]
    );

    const badgesMap = new Map<string, string[]>();
    
    // Initialize empty arrays for all products
    for (const id of productIds) {
      badgesMap.set(id, []);
    }

    // Populate badges
    for (const row of result.rows) {
      const productId = row.product_id as string;
      const collectionSlug = row.slug as keyof typeof BADGE_COLLECTIONS;
      
      if (BADGE_COLLECTIONS[collectionSlug]) {
        const existing = badgesMap.get(productId) || [];
        existing.push(BADGE_COLLECTIONS[collectionSlug][language]);
        badgesMap.set(productId, existing);
      }
    }

    return badgesMap;
  } catch (error) {
    console.error('Error fetching products badges:', error);
    return new Map();
  }
}

/**
 * Determine the primary badge to display (priority: Best Seller > New Product)
 */
export function getPrimaryBadge(badges: string[], language: 'en' | 'bg' = 'en'): string | null {
  if (badges.length === 0) return null;
  
  const bestSellerLabel = language === 'bg' ? 'Най-продаван' : 'Best Seller';
  const newProductLabel = language === 'bg' ? 'Нов продукт' : 'New Product';
  
  // Priority: Best Seller first, then New Product
  if (badges.includes(bestSellerLabel)) return bestSellerLabel;
  if (badges.includes(newProductLabel)) return newProductLabel;
  
  return badges[0];
}
