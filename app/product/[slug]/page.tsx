"use client";

import Link from "next/link";
import { ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ColorSelector from "@/components/ColorSelector";
import PriceNote from "@/components/PriceNote";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const productImages = [
  "/lovable-uploads/rpx-kite.jpg",
  "/lovable-uploads/ghost-kite.jpg",
  "/lovable-uploads/ufo-kite.jpg"
];

const colorOptions = [
  { name: "Blue", value: "blue", bgClass: "bg-blue-500" },
  { name: "Green", value: "green", bgClass: "bg-emerald-500" },
  { name: "Orange", value: "orange", bgClass: "bg-orange-500" },
];

const product = {
  id: "1",
  name: "RPX V2",
  category: "Kite",
  price: 1899,
  description:
    "The RPX V2 delivers unmatched performance for freeride and big air. Built with premium materials and refined aerodynamics for explosive power and smooth handling.",
  sizes: ["7m", "9m", "10m", "12m"],
  specs: [
    { label: "Type", value: "Freeride / Big Air" },
    { label: "Skill Level", value: "Intermediate - Advanced" },
    { label: "Wind Range", value: "12-35 knots" },
    { label: "Material", value: "Teijin Dacron" }
  ],
  image: productImages[0],
  images: productImages,
  slug: "rpx-v2"
};

const related = [
  { id: "2", name: "Ghost V3", category: "Kite", price: 1799, image: "/lovable-uploads/ghost-kite.jpg", slug: "ghost-v3" },
  { id: "3", name: "UFO V3", category: "Kite", price: 1699, image: "/lovable-uploads/ufo-kite.jpg", slug: "ufo-v3" }
];

export default function Page({ params }: { params: { slug?: string } }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[1]);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { language } = useLanguage();

  const handleAddToInquiry = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="section-container py-4 border-b border-border animate-fade-in">
          <nav className="flex items-center gap-2 text-sm font-body text-muted-foreground">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/shop" className="hover:text-accent">
              Shop
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>

        <div className="section-container section-padding">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="animate-fade-in">
              <ProductGallery images={product.images} productName={product.name} />
            </div>
            <div className="flex flex-col justify-center animate-fade-in" style={{ animationDelay: "100ms" }}>
              <span className="text-section-title text-accent mb-2">{product.category}</span>
              <h1 className="h1 text-foreground mb-4">{product.name}</h1>
              <p className="font-body text-muted-foreground mb-6 leading-relaxed">{product.description}</p>
              <div className="mb-6">
                <PriceNote />
              </div>
              <p className="price-display text-2xl mb-6">€{product.price.toLocaleString()}</p>
              <div className="mb-6">
                <span className="font-heading font-semibold text-sm uppercase tracking-wide text-foreground mb-3 block">
                  {t.size}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded border font-body text-sm transition-all ${
                        selectedSize === size ? "border-accent bg-accent text-white" : "border-border hover:border-primary"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <ColorSelector
                  colors={colorOptions}
                  selectedColor={selectedColor}
                  onColorSelect={setSelectedColor}
                />
              </div>
              <div className="mb-8">
                <span className="font-heading font-semibold text-sm uppercase tracking-wide text-foreground mb-3 block">
                  {t.quantity}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="touch-target flex items-center justify-center border border-border rounded hover:border-primary"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-body text-lg w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="touch-target flex items-center justify-center border border-border rounded hover:border-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button onClick={handleAddToInquiry} className="btn-primary w-full sm:w-auto">
                <ShoppingBag className="w-5 h-5 mr-2" /> {t.addToInquiry}
              </button>
            </div>
          </div>
        </div>

        <div className="section-container pb-16 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="h3 text-foreground mb-6">{t.specs}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex justify-between py-3 border-b border-border">
                <span className="font-body text-muted-foreground">{spec.label}</span>
                <span className="font-heading font-medium text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary/30 section-padding">
          <div className="section-container">
            <h2 className="h3 text-foreground mb-8">{t.related}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

