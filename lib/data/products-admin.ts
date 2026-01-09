import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';

export async function getAdminProducts() {
    try {
        const { rows: productRows = [] } = await query(`
      SELECT
        p.*,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'handle', c.handle
        ) AS category_info
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
      LIMIT 1000
    `);

        const productIds = productRows.map((row: any) => row.id).filter(Boolean);

        // We'll process images later in map since async transformation needed
        const { rows: imageRows = [] } =
            productIds.length > 0
                ? await query(
                    `
              SELECT id, product_id, storage_path, size, display_order
              FROM product_images_railway
              WHERE product_id = ANY($1) AND size = 'thumb'
              ORDER BY display_order ASC
            `,
                    [productIds]
                )
                : { rows: [] };

        const { rows: variantRows = [] } =
            productIds.length > 0
                ? await query('SELECT * FROM product_variants WHERE product_id = ANY($1)', [productIds])
                : { rows: [] };

        // Generate presigned URLs for all images found
        const processedImages = await Promise.all(
            imageRows.map(async (row: any) => {
                let url = null;
                try {
                    url = row.storage_path ? await getPresignedUrl(row.storage_path) : null;
                } catch (e) {
                    console.error(`Error signing admin image URL for ${row.id}:`, e);
                }
                return {
                    ...row,
                    url,
                    thumb_url: url
                };
            })
        );

        const imagesByProduct = new Map<string, any[]>();
        processedImages.forEach((img: any) => {
            const list = imagesByProduct.get(img.product_id) || [];
            // Only keep valid URLs
            if (img.url) list.push(img);
            imagesByProduct.set(img.product_id, list);
        });

        const variantsByProduct = new Map<string, any[]>();
        variantRows.forEach((v: any) => {
            const list = variantsByProduct.get(v.product_id) || [];
            list.push(v);
            variantsByProduct.set(v.product_id, list);
        });

        const assembled = productRows.map((product: any) => {
            const { category_info, ...rest } = product;
            const images = imagesByProduct.get(product.id) || [];
            return {
                ...rest,
                category: category_info || null,
                images,
                imageCount: images.length,
                variants: variantsByProduct.get(product.id) || [],
            };
        });

        return assembled;
    } catch (error: any) {
        console.error('Failed to load admin products data', error);
        // Return empty array instead of throwing to prevent page crash
        return [];
    }
}

export async function getAdminProductById(id: string) {
    try {
        const { rows: productRows = [] } = await query(`
      SELECT
        p.*,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'handle', c.handle
        ) AS category_info
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `, [id]);

        if (!productRows.length) return null;
        const product = productRows[0];

        // Fetch images
        const { rows: imageRows = [] } = await query(`
      SELECT id, product_id, storage_path, size, display_order
      FROM product_images_railway
      WHERE product_id = $1
      ORDER BY display_order ASC
    `, [id]);

        // Fetch variants
        const { rows: variantRows = [] } = await query('SELECT * FROM product_variants WHERE product_id = $1', [id]);

        // Sign images
        const processedImages = await Promise.all(
            imageRows.map(async (row: any) => {
                let url = null;
                try {
                    url = row.storage_path ? await getPresignedUrl(row.storage_path) : null;
                } catch (e) {
                    console.error(`Error signing admin image URL for ${row.id}:`, e);
                }
                return {
                    ...row,
                    url,
                    thumb_url: url
                };
            })
        );

        const { category_info, ...rest } = product;
        return {
            ...rest,
            category: category_info || null,
            images: processedImages.filter(img => img.url), // Only valid images
            variants: variantRows,
        };

    } catch (error: any) {
        console.error(`Failed to load admin product ${id}`, error);
        return null;
    }
}
