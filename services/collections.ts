
import { query } from "@/lib/dbPg";

export interface Collection {
    id: string;
    title: string;
    handle: string;
    description: string | null;
    subtitle: string | null;
    image_url: string | null;
    video_url: string | null;
    source: string; // Added source
    products: any[];
    child_collections?: any[];
}

import { getPresignedUrl } from "@/lib/railway/storage";

export async function getCollectionBySlug(slug: string, lang: string = 'en'): Promise<Collection | null> {
    // Fetch collection details by slug
    const collectionRes = await query(
        `SELECT 
            c.id, 
            c.slug,
            COALESCE(NULLIF(ct.title, ''), c.title) as title, 
            c.handle, 
            c.handle, 
            c.description, 
            ct.subtitle,
            c.image_url, 
            c.video_url,
            c.source
     FROM collections c
     LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = $2
     WHERE (c.slug = $1 OR c.slug = 'collections/' || $1) AND c.visible = true`,
        [slug, lang]
    );

    if (collectionRes.rows.length === 0) {
        return null;
    }

    const collection = collectionRes.rows[0];

    // Sign the image URL - prefer full size (1900px) for frontend hero
    let signedImageUrl = collection.image_url;
    if (collection.image_url && !collection.image_url.startsWith('http') && !collection.image_url.startsWith('/')) {
        try {
            // Replace /thumb/ with /full/ to get 1900px version for frontend
            const fullPath = collection.image_url.replace('/thumb/', '/full/');
            signedImageUrl = await getPresignedUrl(fullPath);
        } catch (err) {
            console.error(`Failed to sign collection image URL for ${slug}`, err);
            // Fallback to original path
            try {
                signedImageUrl = await getPresignedUrl(collection.image_url);
            } catch (fallbackErr) {
                console.error(`Fallback signing also failed for ${slug}`);
            }
        }
    }
    collection.image_url = signedImageUrl;

    // Fetch products for this collection
    // We join with products to get full details needed for product card
    // Using subqueries for image and price to be efficient for listing
    const productsRes = await query(
        `SELECT p.*, 
             COALESCE(pt_t.title, p.name) as name, 
             COALESCE(
                 (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id ORDER BY CASE size WHEN 'small' THEN 1 WHEN 'thumb' THEN 2 ELSE 3 END ASC, display_order ASC LIMIT 1),
                 p.og_image_url
             ) as image_path,
             (SELECT price FROM product_variants WHERE product_id = p.id LIMIT 1) as price
      FROM collection_products cp
      JOIN products p ON cp.product_id = p.id
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $2
      WHERE cp.collection_id = $1
      ORDER BY cp.sort_order ASC`,
        [collection.id, lang]
    );

    // Transform to match what frontend expects
    const products = await Promise.all(productsRes.rows.map(async (p: any) => {
        let imageUrl = p.image_path;
        if (p.image_path && !p.image_path.startsWith('http')) {
            try {
                imageUrl = await getPresignedUrl(p.image_path);
            } catch (err) {
                console.error(`Failed to sign product image URL for ${p.slug}:`, err);
                // Fallback to null or original path if needed, but safe to keep as is (will use placeholder in client)
            }
        }

        return {
            ...p,
            price: p.price || 0,
            slug: p.slug || p.handle, // Fallback to handle if slug is missing
            image: imageUrl || '',
            images: imageUrl ? [{ src: imageUrl, alt: p.name }] : []
        };
    }));

    // Fetch child collections (meta-collection feature)
    // Only show child collections that have at least one product
    const childrenRes = await query(
        `SELECT 
            c.id,
            c.slug,
            c.image_url,
            COALESCE(ct.title, c.title) as title,
            ct.subtitle
         FROM collections c
         INNER JOIN collection_listings cl ON cl.child_id = c.id
         LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = $2
         WHERE cl.parent_id = $1
           AND EXISTS (SELECT 1 FROM collection_products cp WHERE cp.collection_id = c.id)
         ORDER BY cl.sort_order ASC, title ASC`,
        [collection.id, lang]
    );

    const child_collections = await Promise.all(childrenRes.rows.map(async (c: any) => {
        let signedUrl = c.image_url;
        if (c.image_url && !c.image_url.startsWith('http') && !c.image_url.startsWith('/')) {
            try {
                // Use middle.webp for category listing thumbnails
                const thumbPath = c.image_url.replace('/full/', '/middle/').replace('/thumb/', '/middle/');
                signedUrl = await getPresignedUrl(thumbPath);
            } catch (err) {
                console.error(`Failed to sign child collection image URL for ${c.slug}`, err);
                try {
                    signedUrl = await getPresignedUrl(c.image_url);
                } catch (e) { }
            }
        }
        return {
            ...c,
            image_url: signedUrl
        };
    }));

    return {
        ...collection,
        products,
        child_collections
    };
}

export async function getCollectionsByBrand(brand: string, lang: string = 'en'): Promise<Collection[]> {
    // Fetch all collections for a specific brand (source)
    const result = await query(
        `SELECT 
            c.id,
            c.slug,
            c.image_url,
            c.source,
            COALESCE(NULLIF(ct.title, ''), c.title) as title,
            ct.subtitle,
            (SELECT COUNT(*)::int FROM collection_products cp WHERE cp.collection_id = c.id) as product_count
        FROM collections c
        LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = $2
        WHERE c.source = $1 AND c.visible = true
        AND EXISTS (SELECT 1 FROM collection_products cp WHERE cp.collection_id = c.id)
        ORDER BY c.sort_order ASC, c.title ASC`,
        [brand, lang]
    );

    // Sign URLs - similar logic to getCollectionBySlug
    const collectionsWithSignedUrls = await Promise.all(result.rows.map(async (c: any) => {
        let signedUrl = c.image_url;

        // Only sign if it's not a full URL OR if it's a known internal bucket path
        if (c.image_url && !c.image_url.startsWith('http') && !c.image_url.startsWith('/')) {
            try {
                // Use middle.webp for listing thumbnails if possible
                const thumbPath = c.image_url.includes('/thumb/')
                    ? c.image_url.replace('/thumb/', '/middle/')
                    : c.image_url;

                signedUrl = await getPresignedUrl(thumbPath);
            } catch (error) {
                console.error(`Failed to sign URL for ${c.slug}:`, error);
                // Try fallback to original
                try {
                    signedUrl = await getPresignedUrl(c.image_url);
                } catch (e) { }
            }
        }
        return {
            ...c,
            image_url: signedUrl,
            products: [] // Empty products array to match interface
        };
    }));

    return collectionsWithSignedUrls as Collection[];
}
