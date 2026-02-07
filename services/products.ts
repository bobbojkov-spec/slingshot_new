
import { query } from '@/lib/db';
import { getPresignedUrl, getKeyFromUrl } from '@/lib/railway/storage';

export interface Product {
    id: string;
    name: string;
    title?: string;
    category: string;
    price: number;
    description: string;
    brand?: string;
    sizes?: string[]; // Maybe unused?
    variants?: Array<{
        id: string;
        title: string;
        price: number;
        compareAtPrice: number | null;
        available: boolean;
        inventory_quantity: number;
        sku: string;
        product_color_id?: string;
    }>;
    specs: { label: string; value: string }[];
    image: string;
    images: string[];
    slug: string;
    category_name?: string;
    category_slug?: string;
    product_type?: string;
    features?: string[];
    name_bg?: string;
    description_bg?: string;
    colors?: Array<{ id: string; name: string; url: string; image_path: string }>;
    availability?: Array<{ variant_id: string; color_id: string; stock_qty: number; is_active: boolean }>;
    video_url?: string;
    description_html?: string;
    description_html_bg?: string;
    description_html2?: string;
    description_html2_bg?: string;
    specs_html?: string;
    specs_html_bg?: string;
    package_includes?: string;
    package_includes_bg?: string;
    hero_video_url?: string;
    sku?: string;
    subtitle?: string;
    subtitle_bg?: string;
    hero_image_url?: string;
    tags?: string[];
    collections?: string[];
    badge?: string | null;
}

export async function getProductBySlug(slug: string): Promise<{ product: Product, related: any[] } | null> {
    try {
        // 1. Fetch Product
        const productSql = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.title, -- Added title
        p.description,
        p.description_bg,
        p.name_bg,
        p.product_type,
        p.brand, -- Added brand
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(
          (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id ORDER BY CASE size WHEN 'big' THEN 1 WHEN 'original' THEN 2 ELSE 3 END ASC, display_order ASC LIMIT 1),
          (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position ASC LIMIT 1)
        ) as image_path,
        p.category_id,
        p.features, -- New Column
        p.video_url, -- Youtube URL
        p.hero_video_url, -- Uploaded MP4 URL
        p.description_html,
        p.description_html2,
        p.specs_html,
        p.package_includes,
        p.subtitle,
        p.sku,
        p.hero_image_url,
        p.tags
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE (p.slug = $1 OR p.id::text = $1) AND p.status = 'active'
    `;
        const productResult = await query(productSql, [slug]);

        if (productResult.rows.length === 0) {
            return null;
        }

        const product = productResult.rows[0];

        // Sign Hero Video URL if it's a private upload
        if (product.hero_video_url) {
            const key = getKeyFromUrl(product.hero_video_url) || product.hero_video_url;
            try {
                product.hero_video_url = await getPresignedUrl(key);
            } catch (e) {
                console.error('Failed to sign hero video url', e);
            }
        }

        // Sign Hero Image URL if present
        if (product.hero_image_url) {
            const key = getKeyFromUrl(product.hero_image_url) || product.hero_image_url;
            try {
                product.hero_image_url = await getPresignedUrl(key);
            } catch (e) {
                console.error('Failed to sign hero image url', e);
            }
        }

        // 2. Fetch Variants (for pricing and options)
        const variantsSql = `
      SELECT
        id,
        price,
        compare_at_price,
        inventory_quantity,
        title,
        name_en, -- Use this for display
        name_bg,
        sku,
        available,
        status,
        position,
        product_color_id
      FROM product_variants
      WHERE product_id = $1 AND status = 'active'
      ORDER BY position ASC
    `;
        const imagesSql = `
      SELECT url as storage_path, position as display_order
      FROM product_images 
      WHERE product_id = $1 
      ORDER BY position ASC
    `;

        const localImagesSql = `
      SELECT storage_path as url, display_order as position
      FROM product_images_railway
      WHERE product_id = $1
        AND id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY bundle_id 
              ORDER BY CASE size WHEN 'big' THEN 1 WHEN 'original' THEN 2 ELSE 3 END ASC
            ) as rn 
            FROM product_images_railway 
            WHERE product_id = $1
          ) sub WHERE rn = 1
        )
      ORDER BY display_order ASC
    `;

        const colorsSql = `
      SELECT id, name, image_path, display_order
      FROM product_colors
      WHERE product_id = $1
      ORDER BY display_order ASC
    `;

        const availabilitySql = `
      SELECT
        pva.variant_id,
        pva.color_id,
        pva.stock_qty,
        pva.is_active
      FROM product_variant_availability pva
      JOIN product_variants pv ON pv.id = pva.variant_id
      WHERE pv.product_id = $1
    `;

        const translationsSql = `
      SELECT language_code, title, description_html, description_html2, specs_html, package_includes
      FROM product_translations
      WHERE product_id = $1
    `;

        const collectionsSql = `
      SELECT c.title, c.slug
      FROM collections c
      JOIN collection_products cp ON cp.collection_id = c.id
      WHERE cp.product_id = $1 AND c.visible = true
      ORDER BY c.title
    `;

        const [variantsResult, imagesResult, localImagesResult, colorsResult, translationsResult, availabilityResult, collectionsResult] = await Promise.all([
            query(variantsSql, [product.id]),
            query(imagesSql, [product.id]),
            query(localImagesSql, [product.id]),
            query(colorsSql, [product.id]),
            query(translationsSql, [product.id]),
            query(availabilitySql, [product.id]),
            query(collectionsSql, [product.id]),
        ]);

        // Process Translations
        const translations = translationsResult.rows;
        const bgTrans = translations.find((t: any) => t.language_code === 'bg');
        if (bgTrans) {
            product.name_bg = bgTrans.title || product.name_bg;
            product.description_html_bg = bgTrans.description_html;
            product.description_html2_bg = bgTrans.description_html2;
            product.specs_html_bg = bgTrans.specs_html;
            product.package_includes_bg = bgTrans.package_includes;
        }


        const variants = variantsResult.rows;
        // ... (image processing remains same)
        const imageRowsRaw = imagesResult.rows;
        const localImageRows = localImagesResult.rows.map((r: any) => ({
            storage_path: r.url, // Use exact path from DB (no leading slash needed for S3 keys)
            display_order: r.position
        }));
        const allImageRows = [...imageRowsRaw, ...localImageRows].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        const seenPaths = new Set();
        const imageRows = allImageRows.filter((r: any) => {
            if (seenPaths.has(r.storage_path)) return false;
            seenPaths.add(r.storage_path);
            return true;
        });

        // Process Product Colors
        const productColors = await Promise.all(colorsResult.rows.map(async (c: any) => ({
            ...c,
            url: c.image_path ? await getPresignedUrl(c.image_path) : null
        })));

        // Get Min/Max Price
        const prices = variants.map((v: any) => parseFloat(v.price)).filter((p: number) => !isNaN(p));
        const price = prices.length > 0 ? Math.min(...prices) : 0;

        // Extract variant options
        const variantOptions = variants.map((v: any) => ({
            id: v.id,
            title: v.name_en || v.name_bg || v.title || 'Default',
            price: parseFloat(v.price || 0),
            compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
            available: v.available,
            inventory_quantity: parseInt(v.inventory_quantity || 0),
            sku: v.sku,
            product_color_id: v.product_color_id
        }));

        // Helper for Badge Logic
        const calculateBadge = (tags: string[]) => {
            if (!tags || !Array.isArray(tags)) return null;
            const hasTag = (t: string) => tags.some((tag: string) => tag.toLowerCase() === t.toLowerCase());
            if (hasTag('new')) return 'New';
            if (hasTag('best seller') || hasTag('bestseller')) return 'Best Seller';
            if (hasTag('sale')) return 'Sale';
            return null;
        };

        // 3. Fetch Related Products (Same Product Type or Category, max 4)
        // Prefer same type, fallback to category.
        const relatedSql = `
      SELECT 
        p.id, p.name, p.title, p.slug, 
        (
          SELECT storage_path 
          FROM product_images_railway pir 
          WHERE pir.product_id = p.id AND pir.size IN ('medium', 'big') 
          ORDER BY CASE WHEN pir.size='medium' THEN 1 ELSE 2 END ASC, display_order ASC 
          LIMIT 1
        ) as image_path,
        (
          SELECT storage_path 
          FROM product_images_railway pir 
          WHERE pir.product_id = p.id AND pir.size IN ('medium', 'big') 
          ORDER BY CASE WHEN pir.size='medium' THEN 1 ELSE 2 END ASC, display_order ASC 
          OFFSET 1 LIMIT 1
        ) as secondary_image_path,
        (SELECT price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as price,
        (SELECT compare_at_price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as original_price,
         c.name as category_name,
         c.slug as category_slug,
         p.tags
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1 
      AND p.id != $2
      AND p.status = 'active'
      ORDER BY RANDOM()
      LIMIT 4
    `;
        const relatedResult = await query(relatedSql, [product.category_id, product.id]);
        const related = await Promise.all(relatedResult.rows.map(async (row: any) => ({
            id: row.id,
            name: row.title || row.name,
            category: row.category_name,
            category_slug: row.category_slug,
            price: parseFloat(row.price || '0'),
            originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
            image: row.image_path ? await getPresignedUrl(row.image_path) : null,
            secondaryImage: row.secondary_image_path ? await getPresignedUrl(row.secondary_image_path) : null,
            slug: row.slug,
            badge: calculateBadge(row.tags)
        })));

        // 4. Specs - Hardcoded for now or fetch?
        // User requested dynamic. If not in DB, maybe just generic?
        // Let's keep the generic specs from the static page for now, or infer from Type.
        const specs = [
            { label: "Type", value: product.product_type },
            { label: "Category", value: product.category_name },
            // Add more real specs if available in DB
        ];

        // Images: Fetch from product_images table
        // fallback to og_image_url if no images found?
        // Images: Fetch from product_images table
        let images = await Promise.all(imageRows.map(async (r: any) => {
            let key = r.storage_path;
            // Use helper to extract key if it's a full URL
            const extractedKey = getKeyFromUrl(key);
            if (extractedKey) key = extractedKey;

            return await getPresignedUrl(key);
        }));
        images = images.filter(Boolean); // Remove nulls

        const mainImage = product.image_path
            ? await getPresignedUrl(product.image_path)
            : null;

        if (images.length === 0 && mainImage) {
            images = [mainImage];
        }

        // Extract collection names for SEO
        const collections = collectionsResult.rows.map((c: any) => c.title);

        return {
            product: {
                ...product,
                name: product.title || product.name, // Use Title as the primary Name
                title: product.title,
                brand: product.brand,
                image: mainImage,
                price,
                images,
                variants: variantOptions,
                specs,
                features: product.features || [], // Return features
                colors: productColors,
                availability: availabilityResult.rows || [],
                tags: product.tags || [], // For SEO keywords
                collections, // For SEO keywords
                badge: calculateBadge(product.tags)
            },
            related
        };

    } catch (error: any) {
        console.error('Failed to fetch product:', error);
        return null;
    }
}
