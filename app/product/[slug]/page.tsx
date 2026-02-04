'use client';

import { Suspense, useEffect, useState, use } from 'react';
import Link from "next/link";
import { ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import ColorSelector from "@/components/ColorSelector";
import PriceNote from "@/components/PriceNote";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import BackgroundVideoPlayer from "@/components/ui/BackgroundVideoPlayer";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { buildBreadcrumbSchema, businessInfo } from "@/lib/seo/business";

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
  video_url?: string;
  description_html?: string;
  description_html2?: string;
  specs_html?: string;
  package_includes?: string;
  hero_video_url?: string;
  sku?: string;
  subtitle?: string;
  hero_image_url?: string;
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
  const { language } = useLanguage();

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

  const handleAddToInquiry = () => {
    if (!product) return;

    let variantId = product.id;
    let price = product.price;

    if (product.variants && product.variants.length > 0) {
      let matchingVariant;
      if (selectedColorId) {
        matchingVariant = product.variants.find(v => v.title === selectedSize && v.product_color_id === selectedColorId);
      } else {
        matchingVariant = product.variants.find(v => v.title === selectedSize);
      }

      if (matchingVariant) {
        variantId = matchingVariant.id;
        price = matchingVariant.price;
      }
    }

    addItem({
      id: variantId,
      name: product.name,
      price: price,
      image: product.image,
      size: selectedSize,
      color: selectedColorId ? product.colors?.find(c => c.id === selectedColorId)?.name : undefined,
      category: product.category,
      slug: product.slug,
      qty: quantity
    });
  };

  const t = {
    size: language === "bg" ? "Размер" : "Size",
    quantity: language === "bg" ? "Количество" : "Quantity",
    addToInquiry: language === "bg" ? "Добави за запитване" : "Add to Inquiry",
    specs: language === "bg" ? "Спецификации" : "Specifications",
    related: language === "bg" ? "Може да харесате" : "You May Also Like"
  };

  if (loading) return <div className="min-h-screen pt-32 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;
  if (error || !product) return <div className="min-h-screen pt-32 text-center text-red-500">Product not found</div>;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(product.brand?.toLowerCase() === "ride engine" || product.brand?.toLowerCase() === "rideengine"
      ? [{ label: "RIDEENGINE", href: "/shop?brand=Ride%20Engine" }]
      : []),
    ...(product.brand?.toLowerCase() === "slingshot"
      ? [{ label: "SLINGSHOT", href: "/shop?brand=Slingshot" }]
      : []),
    ...(product.category_name
      ? [{ label: product.category_name, href: `/shop?category=${product.category_slug || product.category_name?.toLowerCase()}` }]
      : []),
    { label: product.name }
  ];

  const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "";
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

  return (
    <div className="min-h-screen bg-background relative pt-16 md:pt-20">
      {baseUrl && (
        <>
          <SchemaJsonLd data={breadcrumbSchema} />
          <SchemaJsonLd data={productSchema} />
        </>
      )}
      {/* Breadcrumb Strip */}
      <div className="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-20">
        <div className="section-container">
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-medium uppercase tracking-wider text-gray-500 py-2 md:py-3 overflow-x-auto">
            <Link href="/" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">Shop</Link>

            {(product.brand?.toLowerCase() === 'ride engine' || product.brand?.toLowerCase() === 'rideengine') && (
              <>
                <span>/</span>
                <Link href="/shop?brand=Ride%20Engine" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">RIDEENGINE</Link>
              </>
            )}

            {(product.brand?.toLowerCase() === 'slingshot') && (
              <>
                <span>/</span>
                <Link href="/shop?brand=Slingshot" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">SLINGSHOT</Link>
              </>
            )}

            {product.category_name && (
              <>
                <span>/</span>
                <Link href={`/shop?category=${product.category_slug || product.category_name?.toLowerCase()}`} className="hover:text-black transition-colors text-black/60 whitespace-nowrap">{product.category_name}</Link>
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
              activeIndex={(() => {
                if (!selectedColorId || !product.colors) return 0;
                const color = product.colors.find(c => c.id === selectedColorId);
                if (!color) return 0;
                const idx = product.images.findIndex(img => img === color.url);
                return idx !== -1 ? idx : 0;
              })()}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="text-xs md:text-sm font-bold tracking-xxl text-accent mb-1 md:mb-2 uppercase">{product.category_name}</span>
            <h1 className="h1 font-black uppercase tracking-tighter mb-1 md:mb-2">
              {language === 'bg' ? (product.name_bg || product.title || product.name) : (product.title || product.name)}
            </h1>

            {product.subtitle && (
              <h3 className="h3 font-black uppercase tracking-wide mb-2 text-black leading-tight">
                {product.subtitle}
              </h3>
            )}

            {product.sku && (
              <p className="text-[10px] md:text-xs text-black/60 font-mono mb-4 md:mb-6">{`SKU: ${product.sku}`}</p>
            )}

            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              {(() => {
                let currentPrice: number | null = null;
                let originalPrice: number | null = null;
                let displayPrice: string = "";

                if (selectedSize && product.variants) {
                  const v = product.variants.find(v => v.title === selectedSize);
                  if (v) {
                    currentPrice = v.price;
                    originalPrice = v.compareAtPrice;
                  }
                }

                if (!currentPrice && product.variants && product.variants.length > 0) {
                  const prices = product.variants.map(v => v.price).filter(p => !isNaN(p));
                  if (prices.length > 0) {
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    displayPrice = min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;

                    // For the range view, we'll show the compare_at_price of the cheapest variant if it has one
                    const cheapestVariant = [...product.variants].sort((a, b) => a.price - b.price)[0];
                    if (cheapestVariant && cheapestVariant.compareAtPrice && cheapestVariant.compareAtPrice > cheapestVariant.price) {
                      originalPrice = cheapestVariant.compareAtPrice;
                    }
                  }
                } else if (!currentPrice) {
                  displayPrice = `$${(product.price || 0).toFixed(2)}`;
                } else {
                  displayPrice = `$${currentPrice.toFixed(2)}`;
                }

                return (
                  <>
                    <span className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{displayPrice}</span>
                    {originalPrice && originalPrice > (currentPrice || product.price) && (
                      <span className="text-lg md:text-xl text-muted-foreground line-through font-medium">
                        (${originalPrice.toFixed(2)})
                      </span>
                    )}
                  </>
                );
              })()}
            </div>

            {product.description_html && (
              <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description_html }} />
            )}

            <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: language === 'bg' ? (product.description_bg || product.description) : product.description }} />

            {/* Key Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-3">{language === 'bg' ? 'Основни характеристики' : 'Key Features'}</h4>
                <ul className="space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
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
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-3 block">{language === 'bg' ? 'Цвят' : 'Color'}</span>
                <div className="flex gap-2 md:gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColorId(color.id);
                        const colorVariants = product.variants?.filter(v => v.product_color_id === color.id) || [];
                        const availableSizes = colorVariants.map(v => v.title);
                        if (selectedSize && !availableSizes.includes(selectedSize)) {
                          setSelectedSize("");
                        }
                      }}
                      title={color.name}
                      className={`w-14 h-14 md:w-12 md:h-12 rounded border-2 overflow-hidden relative transition-all ${selectedColorId === color.id ? 'border-black ring-1 ring-black ring-offset-2' : 'border-transparent hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={color.url || color.image_path}
                        alt={color.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {selectedColorId && (
                  <div className="mt-2 text-sm text-gray-600">
                    {product.colors.find(c => c.id === selectedColorId)?.name}
                  </div>
                )}
              </div>
            )}

            {/* Sizes/Variants */}
            {((product.variants && product.variants.length > 0) || (product.sizes && product.sizes.length > 0)) && (
              <div className="mb-6 md:mb-8">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-3 block">{t.size}</span>
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    let displayVariants = product.variants || [];
                    if (selectedColorId) {
                      displayVariants = displayVariants.filter(v => v.product_color_id === selectedColorId);
                    }

                    const sizes = displayVariants.length > 0
                      ? displayVariants.map(v => v.title)
                      : (product.sizes || []);

                    if (sizes.length === 0 && selectedColorId) {
                      return <span className="text-sm text-gray-500 italic">No sizes available for this color.</span>;
                    }

                    return sizes.map((size, idx) => (
                      <button
                        key={`${size}-${idx}`}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 md:px-4 py-2 md:py-2.5 rounded border text-sm font-medium transition-all min-w-[60px] md:min-w-0 ${selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-black text-gray-700"
                          }`}
                      >
                        {size}
                      </button>
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-auto pt-6 md:pt-8 border-t border-gray-100">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden w-full sm:w-fit justify-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-6 md:px-4 py-3 hover:bg-gray-100 transition-colors active:bg-gray-200"
                >
                  <Minus className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <span className="font-medium w-16 md:w-12 text-center text-lg md:text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-6 md:px-4 py-3 hover:bg-gray-100 transition-colors active:bg-gray-200"
                >
                  <Plus className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
              <button onClick={handleAddToInquiry} className="flex-1 bg-black text-white font-bold uppercase tracking-widest py-4 md:py-3 px-8 hover:bg-gray-900 active:bg-gray-800 transition-colors flex items-center justify-center gap-2 rounded text-sm md:text-base">
                <ShoppingBag className="w-5 h-5" /> {t.addToInquiry}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Extended Description (Html2) */}
      {product.description_html2 && (
        <div className="section-container py-8 border-t border-gray-100 mb-8">
          <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: product.description_html2 }} />
        </div>
      )}

      {/* Specs HTML */}
      {product.specs_html && (
        <div className="section-container py-16 border-t border-gray-100">
          <h3 className="h2 font-black uppercase tracking-tight mb-8">
            {language === 'bg' ? 'Спецификации' : 'Specifications'}
          </h3>
          <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: product.specs_html }} />
        </div>
      )}

      {/* Package Includes */}
      {product.package_includes && (
        <div className="bg-gray-50 py-16 border-t border-gray-100">
          <div className="section-container">
            <h3 className="h2 font-black uppercase tracking-tight mb-8">
              {language === 'bg' ? 'Пакетът включва' : 'Package Includes'}
            </h3>
            <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: product.package_includes }} />
          </div>
        </div>
      )}

      {/* Related Products */}
      {
        related.length > 0 && (
          <div className="section-container py-16 border-t border-gray-100">
            <h2 className="h2 font-black uppercase tracking-tight mb-12 text-center">{t.related}</h2>
            <ProductGrid products={related} />
          </div>
        )
      }
    </div>
  );
}
