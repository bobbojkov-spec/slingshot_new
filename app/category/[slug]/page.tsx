"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  slug: string;
}

const allProducts: Product[] = [
  { id: "1", name: "RPX V2", category: "kites", price: 1899, image: "/lovable-uploads/rpx-kite.jpg", badge: "New", slug: "rpx-v2" },
  { id: "2", name: "Ghost V3", category: "kites", price: 1799, originalPrice: 1999, image: "/lovable-uploads/ghost-kite.jpg", badge: "Sale", slug: "ghost-v3" },
  { id: "3", name: "UFO V3", category: "kites", price: 1699, image: "/lovable-uploads/ufo-kite.jpg", slug: "ufo-v3" },
  { id: "4", name: "Fuse", category: "kites", price: 1599, image: "/lovable-uploads/fuse-kite.jpg", slug: "fuse" },
  { id: "5", name: "SlingWing V4", category: "wings", price: 899, image: "/lovable-uploads/slingwing-v4.jpg", badge: "New", slug: "slingwing-v4" },
  { id: "6", name: "SlingWing NXT", category: "wings", price: 799, image: "/lovable-uploads/slingwing-nxt.jpg", slug: "slingwing-nxt" },
  { id: "7", name: "Formula V3", category: "boards", price: 749, image: "/lovable-uploads/formula-board.jpg", slug: "formula-v3" },
  { id: "8", name: "Sci-Fly XT V2", category: "boards", price: 1299, image: "/lovable-uploads/scifly-board.jpg", slug: "scifly-xt-v2" }
];

const categoryData: Record<string, { heroImage: string; descriptionEn: string; descriptionBg: string; }> = {
  kites: {
    heroImage: "/lovable-uploads/hero-wind.jpg",
    descriptionEn: "Discover our complete range of high-performance kites. From freeride to freestyle, we have the perfect kite for every style and skill level.",
    descriptionBg: "Открийте нашата пълна гама от високопроизводителни кайтове. От фрийрайд до фристайл - имаме перфектния кайт за всеки стил и ниво."
  },
  boards: {
    heroImage: "/lovable-uploads/hero-wave.jpg",
    descriptionEn: "High-quality boards designed for maximum performance. Whether you're into wakeboarding, kiteboarding, or foiling, find your perfect ride.",
    descriptionBg: "Висококачествени дъски, проектирани за максимална производителност. Уейкборд, кайтборд или фойлинг - намерете идеалната дъска."
  },
  wings: {
    heroImage: "/lovable-uploads/hero-ridetofly.jpg",
    descriptionEn: "Experience the freedom of wing foiling with our innovative SlingWing range. Easy to learn, incredibly fun, and built to last.",
    descriptionBg: "Изживейте свободата на уинг фойлинга с нашата иновативна серия SlingWing. Лесни за научаване, невероятно забавни и издръжливи."
  },
  foils: {
    heroImage: "/lovable-uploads/hero-wave.jpg",
    descriptionEn: "Take your riding to new heights with our cutting-edge foil systems. Smooth, fast, and exhilarating performance on any water.",
    descriptionBg: "Издигнете карането си на ново ниво с нашите модерни фойл системи. Плавно, бързо и вълнуващо представяне."
  },
  accessories: {
    heroImage: "/lovable-uploads/hero-wind.jpg",
    descriptionEn: "Complete your setup with premium accessories. From harnesses to repair kits, we have everything you need.",
    descriptionBg: "Завършете екипировката си с първокласни аксесоари. От трапези до комплекти за ремонт - имаме всичко необходимо."
  }
};

const categoryNames: Record<string, { en: string; bg: string }> = {
  kites: { en: "Kites", bg: "Кайтове" },
  boards: { en: "Boards", bg: "Дъски" },
  wings: { en: "Wings", bg: "Уингове" },
  foils: { en: "Foils", bg: "Фойлове" },
  accessories: { en: "Accessories", bg: "Аксесоари" }
};

export default function Page({ params }: { params: { slug?: string } }) {
  const category = params.slug || "kites";
  const { language, t } = useLanguage();
  const categoryInfo = categoryData[category] || categoryData.kites;
  const products = allProducts.filter((product) => product.category === category);
  const categoryName =
    language === "bg" ? categoryNames[category]?.bg ?? category : categoryNames[category]?.en ?? category;
  const description =
    language === "bg" ? categoryInfo.descriptionBg : categoryInfo.descriptionEn;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="relative h-[50vh] lg:h-[60vh]">
          <img src={categoryInfo.heroImage} alt={categoryName} className="image-cover" />
          <div className="hero-overlay" />
          <div className="absolute inset-0 flex items-center">
            <div className="section-container">
              <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
                <Link href="/" className="hover:text-white transition-colors">
                  {language === "bg" ? "Начало" : "Home"}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/shop" className="hover:text-white transition-colors">
                  {language === "bg" ? "Магазин" : "Shop"}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{categoryName}</span>
              </nav>
              <h1 className="text-hero text-white mb-4">{categoryName.toUpperCase()}</h1>
              <p className="text-subhero text-white/80 max-w-2xl">{description}</p>
            </div>
          </div>
        </section>

        {products.some((product) => product.badge === "New") && (
          <section className="section-container section-padding-sm border-b border-border">
            <h2 className="text-section-title mb-8">{t("category.new_arrivals")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products
                .filter((product) => product.badge === "New")
                .map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
            </div>
          </section>
        )}

        <section className="section-container section-padding">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-section-title">{t("category.all_products")}</h2>
            <span className="font-body text-sm text-muted-foreground">
              {products.length} {t("shop.products")}
            </span>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-body text-muted-foreground">{t("shop.no_results")}</p>
            </div>
          )}
        </section>

        <section className="bg-secondary/30 section-padding">
          <div className="section-container">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-background rounded-xl p-6">
                <h3 className="font-heading font-semibold mb-2">Free Shipping</h3>
                <p className="font-body text-sm text-muted-foreground">On all orders over 200 BGN</p>
              </div>
              <div className="bg-background rounded-xl p-6">
                <h3 className="font-heading font-semibold mb-2">Expert Advice</h3>
                <p className="font-body text-sm text-muted-foreground">
                  Our team of experienced riders will help you
                </p>
              </div>
              <div className="bg-background rounded-xl p-6">
                <h3 className="font-heading font-semibold mb-2">2 Year Warranty</h3>
                <p className="font-body text-sm text-muted-foreground">On all Slingshot products</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

