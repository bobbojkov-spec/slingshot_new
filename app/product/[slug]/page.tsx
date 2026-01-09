import { query } from "@/lib/db";
import { getProxyUrl } from "@/lib/utils/imagePaths";
import ProductClientWrapper from "./ProductClientWrapper";
import { notFound } from "next/navigation";

// Define helper to fetch product data (mirroring api/products/[slug] logic but server-side)
async function getProductData(slug: string, lang: string = 'en') {
  // Query 1: Product Basic Info
  const productSql = `
    SELECT 
      p.*,
      pt.title as translated_name,
      pt.description_html as translated_description,
      c.name as category_name,
      c.slug as category_slug
    FROM products p
    LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = $2
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = $1 AND p.status = 'active'
  `;
  const { rows: products } = await query(productSql, [slug, lang]);
  if (products.length === 0) return null;
  const product = products[0];

  // Query 2: Images
  const imagesSql = `
    SELECT DISTINCT ON (display_order) storage_path, display_order 
    FROM product_images_railway 
    WHERE product_id = $1 AND size = 'big'
    ORDER BY display_order ASC, created_at DESC
  `;
  const { rows: images } = await query(imagesSql, [product.id]);

  // Query 3: Specs (Tags/Meta) - Simplified for now, or fetch from product_tags ? 
  // Let's assume description contains HTML specs or we skip specs for now if complex.
  // Actually the client wrapper expects `specs`. Let's mock or fetch from tags if possible.

  // Query 4: Variants (Sizes)
  const variantsSql = `
    SELECT title, price, inventory_quantity 
    FROM product_variants 
    WHERE product_id = $1 
    ORDER BY position ASC
  `;
  const { rows: variants } = await query(variantsSql, [product.id]);
  const sizes = [...new Set(variants.map((v: any) => v.title).filter(Boolean))];
  const price = variants.length > 0 ? parseFloat(variants[0].price) : 0;

  // Process Images
  const imageUrls = images.map((img: any) => getProxyUrl(img.storage_path));
  const mainImage = imageUrls.length > 0 ? imageUrls[0] : (product.og_image_url || '/placeholder.jpg');

  // Related Products (Simple: Same Category)
  const relatedSql = `
    SELECT p.id, p.name, p.slug, 
      (SELECT price FROM product_variants pv WHERE pv.product_id = p.id LIMIT 1) as price,
       p.og_image_url
    FROM products p
    WHERE p.category_id = $1 AND p.id != $2 AND p.status = 'active'
    LIMIT 4
  `;
  const { rows: relatedRows } = await query(relatedSql, [product.category_id, product.id]);

  const relatedHelper = await Promise.all(relatedRows.map(async (row: any) => {
    // Fetch main image for related
    const imgSql = `SELECT storage_path FROM product_images_railway WHERE product_id = $1 AND size = 'small' ORDER BY display_order ASC LIMIT 1`;
    const { rows: imgRows } = await query(imgSql, [row.id]);
    let imgUrl = row.og_image_url || '/placeholder.jpg';
    if (imgRows.length > 0) {
      imgUrl = getProxyUrl(imgRows[0].storage_path);
    }
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: parseFloat(row.price || '0'),
      image: imgUrl,
      category: product.category_name // approx
    };
  }));

  return {
    product: {
      id: product.id,
      name: product.translated_name || product.name,
      category: product.category_name, // slug? name? Wrapper expects string
      price: price,
      description: product.translated_description || product.description_html || product.description || '',
      sizes: sizes,
      specs: [], // TODO: Fetch real specs
      image: mainImage, // Main image for OG or cart
      images: imageUrls, // Array for gallery
      slug: product.slug,
      category_name: product.category_name,
      categorySlug: product.category_slug
    },
    related: relatedHelper
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const data = await getProductData(slug, 'en'); // Default EN

  if (!data) {
    notFound();
  }

  return <ProductClientWrapper product={data.product} related={data.related} />;
}

