/**
 * Dynamic SEO Generator for Products
 * Automatically generates meta tags based on product data and language
 */

export interface DynamicSEOInput {
  name: string;
  name_bg?: string;
  title?: string;
  brand?: string;
  category_name?: string;
  description?: string;
  description_bg?: string;
  description_html?: string;
  description_html_bg?: string;
  tags?: string[];
  collections?: string[];
  price?: number;
  image?: string;
  slug: string;
}

export interface DynamicSEOOutput {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  canonicalUrl: string;
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Truncate text to max length, preserving word boundaries
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Generate SEO keywords from product data
 * Returns 4-6 keywords: brand, category, top tags, top collections
 */
function generateKeywords(product: DynamicSEOInput): string {
  const keywords: string[] = [];

  // 1. Brand (always first if present)
  if (product.brand) {
    keywords.push(product.brand);
  }

  // 2. Category
  if (product.category_name) {
    keywords.push(product.category_name);
  }

  // 3. First 2-3 tags
  if (product.tags && product.tags.length > 0) {
    const topTags = product.tags
      .filter(tag => tag.toLowerCase() !== 'new' && tag.toLowerCase() !== 'sale')
      .slice(0, 3);
    keywords.push(...topTags);
  }

  // 4. First collection (if not already included)
  if (product.collections && product.collections.length > 0) {
    const collection = product.collections[0];
    if (!keywords.some(k => k.toLowerCase() === collection.toLowerCase())) {
      keywords.push(collection);
    }
  }

  // Remove duplicates and limit to 6
  const unique = Array.from(new Set(keywords.map(k => k.toLowerCase())));
  return unique.slice(0, 6).join(', ');
}

/**
 * Get product description, stripped of HTML
 */
function getDescription(product: DynamicSEOInput, language: 'en' | 'bg'): string {
  const html = language === 'bg'
    ? (product.description_html_bg || product.description_html || product.description_bg || product.description || '')
    : (product.description_html || product.description || '');

  return stripHtml(html);
}

/**
 * Generate dynamic SEO metadata for a product
 */
export function generateDynamicSEO(
  product: DynamicSEOInput,
  language: 'en' | 'bg',
  baseUrl: string
): DynamicSEOOutput {
  // Get localized product name
  const productName = language === 'bg'
    ? (product.name_bg || product.title || product.name)
    : (product.title || product.name);

  const brand = product.brand || '';
  const category = product.category_name || '';

  // Title: "{Name} | {Brand} | Slingshot Bulgaria" (max 60 chars)
  let title = productName;
  if (brand && title.length + brand.length + 3 <= 55) {
    title = `${title} | ${brand}`;
  }
  title = `${title} | Slingshot Bulgaria`;
  title = truncate(title, 60);

  // Description: Localized template with product info (max 160 chars)
  let description: string;
  if (language === 'bg') {
    description = `Купи ${productName}${brand ? ` от ${brand}` : ''}.${category ? ` ${category}.` : ''} Безплатна доставка над 200лв.`;
  } else {
    description = `Buy ${productName}${brand ? ` from ${brand}` : ''}.${category ? ` ${category}.` : ''} Free shipping over 200 BGN.`;
  }

  // If description is too short, add from product description
  if (description.length < 100) {
    const productDesc = getDescription(product, language);
    if (productDesc) {
      const remaining = 155 - description.length;
      if (remaining > 20) {
        description = description + ' ' + truncate(productDesc, remaining);
      }
    }
  }
  description = truncate(description, 160);

  // Keywords: brand, category, tags, collections
  const keywords = generateKeywords(product);

  // OG Title: Same as meta title but can be longer
  const ogTitle = `${productName}${brand ? ` | ${brand}` : ''} | Slingshot Bulgaria`;

  // OG Description: Can be longer (up to 200 chars)
  let ogDescription = language === 'bg'
    ? `Купи ${productName}${brand ? ` от ${brand}` : ''}.${category ? ` ${category}.` : ''}`
    : `Buy ${productName}${brand ? ` from ${brand}` : ''}.${category ? ` ${category}.` : ''}`;

  const productDesc = getDescription(product, language);
  if (productDesc) {
    ogDescription = ogDescription + ' ' + truncate(productDesc, 200 - ogDescription.length);
  }
  ogDescription = truncate(ogDescription, 200);

  // Canonical URL
  const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/product/${product.slug}`;

  return {
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage: product.image || null,
    canonicalUrl,
  };
}
