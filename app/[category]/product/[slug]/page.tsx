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

interface Product {
  id: string;
  name: string;
  title?: string;
  category: string;
  price: number;
  description: string;
  brand?: string; // Added brand
  sizes?: string[]; // Legacy field
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
  name_bg?: string; // Localized name
  description_bg?: string; // Localized description
  colors?: Array<{ id: string; name: string; url: string; image_path: string }>;
  video_url?: string;
  description_html?: string;
  description_html2?: string;
  specs_html?: string;
  package_includes?: string;
}

export default function Page({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { language } = useLanguage();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data.product);
        setRelated(data.related);

        // Initialize Color Selection
        if (data.product.colors && data.product.colors.length > 0) {
          setSelectedColorId(data.product.colors[0].id);
        }

        // Handle both new variants structure and legacy sizes
        // const availableSizes = data.product.variants?.map((v: any) => v.title) || data.product.sizes || [];
        // if (availableSizes.length > 0) {
        //   setSelectedSize(availableSizes[0]);
        // }
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

    // Find specific variant if size/color selected
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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Breadcrumb Strip - Consistent with Shop/Collection pages */}
      <div className="bg-white border-b border-gray-100 sticky top-[header-height] z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500 py-3">
            <Link href="/" className="hover:text-black transition-colors text-black/60">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-black transition-colors text-black/60">Shop</Link>

            {(product.brand === 'Ride Engine' || product.brand === 'RideEngine' || product.brand === 'rideengine') && (
              <>
                <span>/</span>
                <Link href="/shop?brand=Ride%20Engine" className="hover:text-black transition-colors text-black/60">RIDEENGINE</Link>
              </>
            )}

            {(product.brand === 'Slingshot' || product.brand === 'slingshot') && (
              <>
                <span>/</span>
                <Link href="/shop?brand=Slingshot" className="hover:text-black transition-colors text-black/60">SLINGSHOT</Link>
              </>
            )}

            {product.category_name && (
              <>
                <span>/</span>
                <Link href={`/shop?category=${product.category_slug || category || product.category_name?.toLowerCase()}`} className="hover:text-black transition-colors text-black/60">{product.category_name}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-black font-bold">{product.name}</span>
          </div>
        </div>
      </div>



      {/* Hero Video Section */}
      {
        product.video_url && (
          <div className="relative h-[60vh] w-full overflow-hidden mb-8 -mt-8">
            <BackgroundVideoPlayer videoUrl={product.video_url} poster={product.image} />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </div>
        )
      }

      <div className="container mx-auto px-4 pt-[50px]">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Gallery */}
          <div className="animate-fade-in">
            <ProductGallery
              images={product.images}
              productName={product.name}
              activeIndex={(() => {
                if (!selectedColorId || !product.colors) return 0;
                const color = product.colors.find(c => c.id === selectedColorId);
                if (!color) return 0;
                // match by exact URL
                const idx = product.images.findIndex(img => img === color.url);
                return idx !== -1 ? idx : 0;
              })()}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="text-sm font-bold tracking-[0.2em] text-accent mb-2 uppercase">{product.category_name}</span>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              {language === 'bg' ? (product.name_bg || product.title || product.name) : (product.title || product.name)}
            </h1>
            <div className="text-2xl font-bold mb-4">
              {(() => {
                if (selectedSize && product.variants) {
                  const v = product.variants.find(v => v.title === selectedSize);
                  if (v) return `€${v.price.toLocaleString()}`;
                }
                if (product.variants && product.variants.length > 0) {
                  const prices = product.variants.map(v => v.price).filter(p => !isNaN(p));
                  if (prices.length > 0) {
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    return min === max
                      ? `€${min.toLocaleString()}`
                      : `€${min.toLocaleString()} - €${max.toLocaleString()}`;
                  }
                }
                return `€${product.price ? product.price.toLocaleString() : '0'}`;
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
              <div className="mb-8">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-3 block">{language === 'bg' ? 'Цвят' : 'Color'}</span>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColorId(color.id);
                        // Filter variants for the new color and check if selected size matches
                        const colorVariants = product.variants?.filter(v => v.product_color_id === color.id) || [];
                        const availableSizes = colorVariants.map(v => v.title);
                        if (selectedSize && !availableSizes.includes(selectedSize)) {
                          setSelectedSize("");
                        }
                      }}
                      title={color.name}
                      className={`w-12 h-12 rounded-md border-2 overflow-hidden relative transition-all ${selectedColorId === color.id ? 'border-black ring-1 ring-black ring-offset-2' : 'border-transparent hover:border-gray-300'
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
              <div className="mb-8">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-3 block">{t.size}</span>
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    // Filter variants if color is selected
                    let displayVariants = product.variants || [];
                    if (selectedColorId) {
                      displayVariants = displayVariants.filter(v => v.product_color_id === selectedColorId);
                    }

                    // Fallback for legacy sizes or no variants
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
                        className={`px-4 py-2 rounded border text-sm font-medium transition-all ${selectedSize === size
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
            <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-8 border-t border-gray-100">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleAddToInquiry} className="flex-1 bg-black text-white font-bold uppercase tracking-widest py-3 px-8 hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 rounded">
                <ShoppingBag className="w-5 h-5" /> {t.addToInquiry}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Extended Description (Html2) */}
      {product.description_html2 && (
        <div className="container mx-auto px-4 py-8 border-t border-gray-100 mb-8">
          <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: product.description_html2 }} />
        </div>
      )}

      {/* Package Includes */}
      {product.package_includes && (
        <div className="bg-gray-50 py-16 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Package Includes</h3>
            <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: product.package_includes }} />
          </div>
        </div>
      )}

      {/* Specs HTML */}
      {product.specs_html && (
        <div className="container mx-auto px-4 py-16 border-t border-gray-100">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Specifications</h3>
          <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: product.specs_html }} />
        </div>
      )}

      {/* Specs */}
      {
        product.specs && product.specs.length > 0 && (
          <div className="bg-gray-50 py-16 mt-16 border-t border-gray-100">
            <div className="container mx-auto px-4">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8">{t.specs}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{spec.label}</span>
                    <span className="block font-bold text-lg text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Related Products */}
      {
        related.length > 0 && (
          <div className="container mx-auto px-4 py-16 border-t border-gray-100">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-12 text-center">{t.related}</h2>
            <ProductGrid products={related} />
          </div>
        )
      }
    </div >
  );
}

