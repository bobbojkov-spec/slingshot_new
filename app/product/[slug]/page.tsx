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

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  sizes: string[];
  specs: { label: string; value: string }[];
  image: string;
  images: string[];
  slug: string;
  category_name?: string;
  product_type?: string;
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string>("");
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
        if (data.product.sizes?.length > 0) {
          setSelectedSize(data.product.sizes[0]);
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
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
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
    <div className="min-h-screen bg-background pt-24 pb-12">
      {/* Breadcrumb / Nav */}
      <div className="container mx-auto px-4 mb-8">
        <nav className="flex items-center gap-2 text-sm font-body text-muted-foreground uppercase tracking-wide">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-black">Shop</Link>
          {product.category_name && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/shop?category=${product.category_name.toLowerCase()}`} className="hover:text-black">{product.category_name}</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-black font-semibold">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Gallery */}
          <div className="animate-fade-in">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Details */}
          <div className="flex flex-col animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="text-sm font-bold tracking-[0.2em] text-accent mb-2 uppercase">{product.category_name}</span>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">{product.name}</h1>
            <div className="text-2xl font-bold mb-4">€{product.price.toLocaleString()}</div>

            <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description }} />

            <div className="mb-8">
              <PriceNote />
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-3 block">{t.size}</span>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded border text-sm font-medium transition-all ${selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-black text-gray-700"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
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

      {/* Specs */}
      {product.specs && product.specs.length > 0 && (
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
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <div className="container mx-auto px-4 py-16 border-t border-gray-100">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-12 text-center">{t.related}</h2>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  );
}

