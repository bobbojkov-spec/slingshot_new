'use client';

import { useEffect, useState, use } from 'react';
import Head from "next/head";
import Link from "next/link";
import { ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import PriceNote from "@/components/PriceNote";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductSection } from "@/components/products/ProductSection";
import BackgroundVideoPlayer from "@/components/ui/BackgroundVideoPlayer";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { buildBreadcrumbSchema, businessInfo } from "@/lib/seo/business";
import { buildCanonicalUrlClient } from "@/lib/seo/url";
import { generateDynamicSEO } from "@/lib/seo/generate-dynamic-seo";

interface Product {
  id: string;
  name: string;
  title?: string;
  category: string;
  price: number;
  description: string;
  brand?: string;
  sizes?: string[];
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
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>(process.env.NEXT_PUBLIC_SITE_URL || "");

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!origin && typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }

    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        // Fetch product from API which now handles video URL signing
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data.product);
        setRelated(data.related);

        // Initialize Color Selection
        if (data.product.colors && data.product.colors.length > 0) {
          setSelectedColorId(data.product.colors[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Parse variant title to extract size
  // Handles: "14 / Green", "XS- black", "7 Meter", "XS -green"
  const parseVariantTitle = (title: string) => {
    if (!title) return '';
    // Match size at start: numbers (5, 5.5, 7, 12) OR standard sizes (XS, S, M, L, XL, XXL)
    const match = title.match(/^(\d+(?:\.\d+)?|XXL|XL|L|M|S|XS)\s*(?:[\/\-\s]+)?/i);
    return match ? match[1].toUpperCase() : title;
  };

  // Get color name from variant title (e.g., "14 / Green" -> "Green", "XS- black" -> "black")
  const getColorFromVariantTitle = (title: string) => {
    if (!title) return '';
    // Match color after / or - or space
    const match = title.match(/(?:[\/\-]\s*|\s{2,})(.+)$/);
    return match ? match[1].trim() : '';
  };

  const getAvailabilityEntry = (variantId?: string | null, colorId?: string | null) => {
    if (!variantId || !product?.availability) return null;
    if (!colorId) {
      return product.availability.find((entry) => entry.variant_id === variantId) || null;
    }
    return product.availability.find((entry) => entry.variant_id === variantId && entry.color_id === colorId) || null;
  };

  const getVariantColorId = (variant: NonNullable<Product['variants']>[number]) => {
    if (variant.product_color_id) return variant.product_color_id;
    if (!product?.colors) return null;
    const colorName = getColorFromVariantTitle(variant.title || '');
    if (!colorName) return null;
    const match = product.colors.find((color) => color.name?.toLowerCase() === colorName.toLowerCase());
    return match?.id || null;
  };

  // Get unique size options from variants
  const getUniqueSizeOptions = () => {
    if (!product?.variants) return [];

    // Group variants by size
    const sizeGroups = new Map<string, string>();

    product.variants.forEach(v => {
      const sizeKey = parseVariantTitle(v.title);
      if (sizeKey) {
        // Clean display label - remove color part
        const cleanLabel = v.title.replace(/\s*[\/\-]\s*.+$/, '').trim();
        const existing = sizeGroups.get(sizeKey);
        // Prefer shorter labels (without color info)
        if (!existing || cleanLabel.length < existing.length) {
          sizeGroups.set(sizeKey, cleanLabel);
        }
      }
    });

    // Return array of { numericSize, displayLabel }
    return Array.from(sizeGroups.entries()).map(([sizeKey, displayLabel]) => ({
      numericSize: sizeKey,
      displayLabel
    }));
  };

  // Get selected variant based on size and color
  const getSelectedVariant = () => {
    if (!product?.variants || product.variants.length === 0) return null;

    const sizeOptions = getUniqueSizeOptions();
    const effectiveSize = selectedSize || (sizeOptions.length === 1 ? sizeOptions[0].numericSize : '');

    if (!effectiveSize && sizeOptions.length === 0) {
      return product.variants[0];
    }

    if (effectiveSize) {
      // Find variant where title starts with selected size
      const matchingVariants = product.variants.filter(v =>
        parseVariantTitle(v.title) === effectiveSize
      );

      if (matchingVariants.length === 0) return null;

      // If only one variant matches, return it
      if (matchingVariants.length === 1) return matchingVariants[0];

      // If multiple variants match, try to match by visual color first, fallback to title parsing
      if (selectedColorId) {
        const colorMatch = matchingVariants.find((v) => getVariantColorId(v) === selectedColorId);
        if (colorMatch) return colorMatch;
      }

      // Return first matching variant
      return matchingVariants[0];
    }

    return null;
  };

  // Get stock info for selected combination
  const getStockInfo = () => {
    const variant = getSelectedVariant();
    if (!variant) return null;

    const colorId = selectedColorId || getVariantColorId(variant);
    const availabilityEntry = getAvailabilityEntry(variant.id, colorId);
    const inStock = availabilityEntry
      ? availabilityEntry.is_active && availabilityEntry.stock_qty > 0
      : true;

    return {
      inStock,
      quantity: availabilityEntry?.stock_qty ?? Math.max(variant.inventory_quantity || 0, 1),
      sku: variant.sku
    };
  };

  const handleAddToInquiry = () => {
    if (!product) return;

    const sizeOptions = getUniqueSizeOptions();
    const effectiveSize = selectedSize || (sizeOptions.length === 1 ? sizeOptions[0].numericSize : '');
    const requiresSize = sizeOptions.length > 1;

    if (requiresSize && !effectiveSize) return;

    const variant = getSelectedVariant();
    if (!variant) return;

    const colorId = selectedColorId || getVariantColorId(variant);
    const availabilityEntry = getAvailabilityEntry(variant.id, colorId);
    if (availabilityEntry && (!availabilityEntry.is_active || availabilityEntry.stock_qty <= 0)) return;

    const variantId = variant.id;
    const price = variant.price || product.price;

    addItem({
      id: variantId,
      name: product.name,
      price: price,
      image: product.image,
      size: effectiveSize || selectedSize,
      color: colorId ? product.colors?.find(c => c.id === colorId)?.name : undefined,
      category: product.category,
      slug: product.slug,
      qty: quantity
    });
  };

  // Translation keys - using centralized t() function

  // Clean HTML content from markdown artifacts
  const cleanHtml = (html: string | undefined | null) => {
    if (!html) return '';
    return html.replace(/```html\s*/g, '').replace(/```\s*/g, '').trim();
  };

  if (loading) return <div className="min-h-screen pt-32 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;
  if (error || !product) return <div className="min-h-screen pt-32 text-center text-red-500">{t("product.notFound")}</div>;

  // Normalize brand for URL
  const brandSlug = product.brand?.toLowerCase() === "ride engine" || product.brand?.toLowerCase() === "rideengine"
    ? "ride-engine"
    : product.brand?.toLowerCase() === "slingshot"
      ? "slingshot"
      : null;

  // Check if category is same as brand (to avoid duplication in breadcrumb)
  const categoryIsBrand = product.category_name?.toLowerCase() === "ride engine" ||
    product.category_name?.toLowerCase() === "rideengine" ||
    product.category_name?.toLowerCase() === "slingshot";

  const breadcrumbItems = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.shop"), href: "/shop" },
    ...(brandSlug
      ? [{ label: brandSlug === "ride-engine" ? "RIDE ENGINE" : "SLINGSHOT", href: `/shop?brand=${brandSlug}` }]
      : []),
    ...(product.category_name && !categoryIsBrand
      ? [{ label: product.category_name, href: `/shop?brand=${brandSlug}&category=${product.category_slug || product.category_name?.toLowerCase()}` }]
      : []),
    { label: language === "bg" ? (product.name_bg || product.name) : product.name }
  ];

  const canonicalUrl = buildCanonicalUrlClient(`/product/${product.slug}`);
  const baseUrl = canonicalUrl.replace(/\/.+$/, "");
  const breadcrumbSchema = buildBreadcrumbSchema(baseUrl, breadcrumbItems);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || product.name,
    description: product.description_bg || product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || "Slingshot"
    },
    image: product.images || (product.image ? [product.image] : []),
    category: product.category_name,
    url: baseUrl ? `${baseUrl}/product/${product.slug}` : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: baseUrl ? `${baseUrl}/product/${product.slug}` : undefined
    },
    isRelatedTo: [
      {
        "@type": "Thing",
        name: businessInfo.name,
        url: baseUrl || businessInfo.url
      }
    ]
  };

  // Generate dynamic SEO from product data
  const seo = generateDynamicSEO({
    name: product.name,
    name_bg: product.name_bg,
    title: product.title,
    brand: product.brand,
    category_name: product.category_name,
    description: product.description,
    description_bg: product.description_bg,
    description_html: product.description_html,
    description_html_bg: product.description_html_bg,
    tags: product.tags,
    collections: product.collections,
    price: product.price,
    image: product.image || product.images?.[0],
    slug: product.slug,
  }, language as 'en' | 'bg', origin);

  const sizeOptions = getUniqueSizeOptions();
  const effectiveSize = selectedSize || (sizeOptions.length === 1 ? sizeOptions[0].numericSize : '');
  const requiresSize = sizeOptions.length > 1;
  const requiresColor = (product.colors?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-white relative pt-16 md:pt-20">
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
        <meta property="og:title" content={seo.ogTitle} />
        <meta property="og:description" content={seo.ogDescription} />
        <meta property="og:url" content={seo.canonicalUrl} />
        <meta property="og:site_name" content="Slingshot Bulgaria" />
        <meta property="og:type" content="product" />
        {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.ogTitle} />
        <meta name="twitter:description" content={seo.ogDescription} />
        {seo.ogImage && <meta name="twitter:image" content={seo.ogImage} />}
        <link rel="canonical" href={seo.canonicalUrl} />
      </Head>
      <SchemaJsonLd data={breadcrumbSchema} defer />
      <SchemaJsonLd data={productSchema} defer />
      {/* Breadcrumb Strip */}
      <div className="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-20">
        <div className="section-container">
          <div className="flex items-center gap-2 md:gap-2 text-[10px] md:text-xs font-medium uppercase tracking-wider text-gray-500 py-2 md:py-4 overflow-x-auto">
            <Link href="/" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">{t("breadcrumbs.home")}</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">{t("breadcrumbs.shop")}</Link>

            {brandSlug && (
              <>
                <span>/</span>
                <Link href={`/shop?brand=${brandSlug}`} className="hover:text-black transition-colors text-black/60 whitespace-nowrap">
                  {brandSlug === 'ride-engine' ? 'RIDE ENGINE' : 'SLINGSHOT'}
                </Link>
              </>
            )}

            {product.category_name && !categoryIsBrand && (
              <>
                <span>/</span>
                <Link href={`/shop?brand=${brandSlug}&category=${product.category_slug || product.category_name?.toLowerCase()}`} className="hover:text-black transition-colors text-black/60 whitespace-nowrap">{product.category_name}</Link>
              </>
            )}
            <span className="hidden md:inline">/</span>
            <span className="text-black font-bold hidden md:inline whitespace-nowrap">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section (Only if dedicated content exists) */}
      {(product.hero_video_url || product.hero_image_url) && (
        <div className="hero-media relative w-full overflow-hidden mb-8 -mt-8">
          {product.hero_video_url ? (
            <BackgroundVideoPlayer
              videoUrl={product.hero_video_url}
              poster={product.hero_image_url || product.image}
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${product.hero_image_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>
      )}

      <div className="section-container pt-6 md:pt-12 lg:pt-24">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16">

          {/* Gallery */}
          <div className="animate-fade-in">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="text-xs md:text-sm font-bold tracking-xxl text-accent mb-2 md:mb-2 uppercase">{product.category_name}</span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-2 md:mb-2">
              {language === 'bg' ? (product.name_bg || product.title || product.name) : (product.title || product.name)}
            </h1>

            {product.subtitle && (
              <h3 className="h3 font-bold uppercase tracking-wide mb-2 text-black leading-tight">
                {language === 'bg' ? (product.subtitle_bg || product.subtitle) : product.subtitle}
              </h3>
            )}

            {product.sku && (
              <p className="text-[10px] md:text-xs text-black/60 font-mono mb-4 md:mb-6">{`${t("product.sku")}: ${product.sku}`}</p>
            )}

            {/* Price Display */}
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
              {(() => {
                const selectedVariant = getSelectedVariant();

                // If a size is selected, show that variant's price
                if (selectedVariant) {
                  return (
                    <>
                      <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        €{Math.round(selectedVariant.price).toLocaleString('de-DE')}
                      </span>
                      {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                        <span className="text-lg md:text-xl text-muted-foreground line-through font-medium">
                          €{Math.round(selectedVariant.compareAtPrice).toLocaleString('de-DE')}
                        </span>
                      )}
                    </>
                  );
                }

                // Show price range when no size selected
                if (product.variants && product.variants.length > 0) {
                  const prices = product.variants.map(v => v.price).filter(p => !isNaN(p));
                  if (prices.length > 0) {
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    const displayPrice = min === max ? `€${Math.round(min).toLocaleString('de-DE')}` : `€${Math.round(min).toLocaleString('de-DE')} - €${Math.round(max).toLocaleString('de-DE')}`;
                    return <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{displayPrice}</span>;
                  }
                }

                // Fallback to product price
                return <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">€{Math.round(product.price || 0).toLocaleString('de-DE')}</span>;
              })()}
            </div>

            {(language === 'bg' ? (product.description_html_bg || product.description_html) : product.description_html) && (
              <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.description_html_bg || product.description_html) : product.description_html) }}
              />
            )}

            <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.description_bg || product.description) : product.description) }} />

            {/* Key Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{t("product.keyFeatures")}</h4>
                <ul className="space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-black mt-2.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-8">
              <PriceNote />
            </div>

            {/* Visual Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6 md:mb-8">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-4 block">
                  {t("product.color")}: {selectedColorId && (
                    <span className="font-normal text-gray-600">
                      {product.colors.find(c => c.id === selectedColorId)?.name}
                    </span>
                  )}
                </span>
                <div className="flex gap-2 md:gap-4 flex-wrap">
                  {product.colors.map((color) => {
                    // Check if this color is available for the selected size (availability matrix)
                    let isAvailable = true;
                    if (selectedSize && product.variants) {
                      const matchingVariants = product.variants.filter(v =>
                        parseVariantTitle(v.title) === selectedSize
                      );
                      isAvailable = matchingVariants.some((v) => {
                        const variantColorId = getVariantColorId(v);
                        if (variantColorId !== color.id) return false;
                        const availabilityEntry = getAvailabilityEntry(v.id, color.id);
                        return availabilityEntry ? availabilityEntry.is_active && availabilityEntry.stock_qty > 0 : true;
                      });
                    }

                    return (
                      <button
                        key={color.id}
                        onClick={() => isAvailable && setSelectedColorId(color.id)}
                        disabled={!isAvailable}
                        title={`${color.name}${!isAvailable ? ' (' + (language === 'bg' ? 'изчерпано' : 'out of stock') + ')' : ''}`}
                        className={`w-14 h-14 md:w-12 md:h-12 rounded border-2 overflow-hidden relative transition-all ${selectedColorId === color.id
                          ? 'border-black ring-1 ring-black ring-offset-2'
                          : isAvailable
                            ? 'border-transparent hover:border-gray-300 hover:scale-105'
                            : 'border-gray-200 opacity-40 cursor-not-allowed'
                          }`}
                      >
                        <img
                          src={color.url || color.image_path}
                          alt={color.name}
                          className="w-full h-full object-cover"
                        />
                        {!isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <span className="text-xs text-gray-500">✕</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes/Variants */}
            {(product.variants && product.variants.length > 0) && (
              <div className="mb-6 md:mb-8">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-4 block">{t("size")}</span>
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const sizeOptions = getUniqueSizeOptions();

                    if (sizeOptions.length === 0) {
                      return <span className="text-sm text-gray-500 italic">{t("product.noSizesAvailable")}</span>;
                    }

                    return sizeOptions.map(({ numericSize, displayLabel }, idx) => {
                      // Check if any variant with this size is available
                      const sizeVariants = product.variants?.filter(v =>
                        parseVariantTitle(v.title) === numericSize
                      ) || [];

                      let isAvailable = sizeVariants.length > 0;
                      if (selectedColorId) {
                        isAvailable = sizeVariants.some((v) => {
                          const variantColorId = getVariantColorId(v);
                          if (variantColorId !== selectedColorId) return false;
                          const availabilityEntry = getAvailabilityEntry(v.id, selectedColorId);
                          return availabilityEntry ? availabilityEntry.is_active && availabilityEntry.stock_qty > 0 : true;
                        });
                      }
                      const isSelected = selectedSize === numericSize;

                      return (
                        <button
                          key={`${numericSize}-${idx}`}
                          onClick={() => isAvailable && setSelectedSize(numericSize)}
                          disabled={!isAvailable}
                          className={`px-4 md:px-4 py-2 md:py-2 rounded border text-sm font-medium transition-all min-w-[60px] md:min-w-0 ${isSelected
                            ? "border-black bg-black text-white"
                            : isAvailable
                              ? "border-gray-200 hover:border-black text-gray-700"
                              : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          {displayLabel}
                          {!isAvailable && <span className="sr-only"> ({language === 'bg' ? 'изчерпано' : 'out of stock'})</span>}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-4 mt-auto pt-6 md:pt-8 border-t border-gray-100">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden w-full sm:w-fit justify-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-6 md:px-4 py-4 hover:bg-gray-100 transition-colors active:bg-gray-200"
                >
                  <Minus className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <span className="font-medium w-16 md:w-12 text-center text-lg md:text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-6 md:px-4 py-4 hover:bg-gray-100 transition-colors active:bg-gray-200"
                >
                  <Plus className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToInquiry}
                disabled={(requiresSize && !effectiveSize) || (requiresColor && !selectedColorId)}
                className={`flex-1 font-bold uppercase tracking-widest py-4 md:py-4 px-8 transition-colors flex items-center justify-center gap-2 rounded text-sm md:text-base ${(requiresSize && !effectiveSize) || (requiresColor && !selectedColorId)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-900 active:bg-gray-800'
                  }`}
              >
                <ShoppingBag className="w-5 h-5" /> {t("product.addToInquiry")}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Extended Description (Html2) */}
      {(language === 'bg' ? (product.description_html2_bg || product.description_html2) : product.description_html2) && (
        <div className="section-container py-8 border-t border-gray-100 mb-8">
          <div className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.description_html2_bg || product.description_html2) : product.description_html2) }}
          />
        </div>
      )}

      {/* Specs HTML */}
      {(language === 'bg' ? (product.specs_html_bg || product.specs_html) : product.specs_html) && (
        <div className="section-container py-16 border-t border-gray-100">
          <h3 className="h2 font-bold uppercase tracking-tight mb-8">
            {t("specs")}
          </h3>
          <div className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.specs_html_bg || product.specs_html) : product.specs_html) }}
          />
        </div>
      )}

      {/* Package Includes */}
      {(language === 'bg' ? (product.package_includes_bg || product.package_includes) : product.package_includes) && (
        <div className="section-container py-16 border-t border-gray-100">
          <div className="">
            <h3 className="h2 font-bold uppercase tracking-tight mb-8">
              {language === 'bg' ? 'Пакетът включва' : 'Package Includes'}
            </h3>
            <div className="prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.package_includes_bg || product.package_includes) : product.package_includes) }}
            />
          </div>
        </div>
      )}

      {/* Related Products */}
      {
        related.length > 0 && (
          <ProductSection
            title={language === 'bg' ? "Свързани продукти" : "Related products"}
            products={related}
            className="product-listing-bg section-padding border-t border-gray-100"
          />
        )
      }
    </div>
  );
}
