import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronRight } from "lucide-react";

// Import product images
import rpxKite from "@/assets/products/rpx-kite.jpg";
import ghostKite from "@/assets/products/ghost-kite.jpg";
import ufoKite from "@/assets/products/ufo-kite.jpg";
import fuseKite from "@/assets/products/fuse-kite.jpg";
import slingwingV4 from "@/assets/products/slingwing-v4.jpg";
import slingwingNxt from "@/assets/products/slingwing-nxt.jpg";
import formulaBoard from "@/assets/products/formula-board.jpg";
import sciflyBoard from "@/assets/products/scifly-board.jpg";

// Category hero images
import heroWind from "@/assets/hero-wind.jpg";
import heroWave from "@/assets/hero-wave.jpg";
import heroRidetofly from "@/assets/hero-ridetofly.jpg";

const allProducts = [
  { id: "1", name: "RPX V2", category: "kites", price: 1899, image: rpxKite, badge: "New", slug: "rpx-v2" },
  { id: "2", name: "Ghost V3", category: "kites", price: 1799, originalPrice: 1999, image: ghostKite, badge: "Sale", slug: "ghost-v3" },
  { id: "3", name: "UFO V3", category: "kites", price: 1699, image: ufoKite, slug: "ufo-v3" },
  { id: "4", name: "Fuse", category: "kites", price: 1599, image: fuseKite, slug: "fuse" },
  { id: "5", name: "SlingWing V4", category: "wings", price: 899, image: slingwingV4, badge: "New", slug: "slingwing-v4" },
  { id: "6", name: "SlingWing NXT", category: "wings", price: 799, image: slingwingNxt, slug: "slingwing-nxt" },
  { id: "7", name: "Formula V3", category: "boards", price: 749, image: formulaBoard, slug: "formula-v3" },
  { id: "8", name: "Sci-Fly XT V2", category: "boards", price: 1299, image: sciflyBoard, slug: "scifly-xt-v2" },
];

const categoryData: Record<string, { heroImage: string; descriptionEn: string; descriptionBg: string }> = {
  kites: {
    heroImage: heroWind,
    descriptionEn: "Discover our complete range of high-performance kites. From freeride to freestyle, we have the perfect kite for every style and skill level.",
    descriptionBg: "Открийте нашата пълна гама от високопроизводителни кайтове. От фрийрайд до фристайл - имаме перфектния кайт за всеки стил и ниво.",
  },
  boards: {
    heroImage: heroWave,
    descriptionEn: "High-quality boards designed for maximum performance. Whether you're into wakeboarding, kiteboarding, or foiling, find your perfect ride.",
    descriptionBg: "Висококачествени дъски, проектирани за максимална производителност. Уейкборд, кайтборд или фойлинг - намерете идеалната дъска.",
  },
  wings: {
    heroImage: heroRidetofly,
    descriptionEn: "Experience the freedom of wing foiling with our innovative SlingWing range. Easy to learn, incredibly fun, and built to last.",
    descriptionBg: "Изживейте свободата на уинг фойлинга с нашата иновативна серия SlingWing. Лесни за научаване, невероятно забавни и издръжливи.",
  },
  foils: {
    heroImage: heroWave,
    descriptionEn: "Take your riding to new heights with our cutting-edge foil systems. Smooth, fast, and exhilarating performance on any water.",
    descriptionBg: "Издигнете карането си на ново ниво с нашите модерни фойл системи. Плавно, бързо и вълнуващо представяне.",
  },
  accessories: {
    heroImage: heroWind,
    descriptionEn: "Complete your setup with premium accessories. From harnesses to repair kits, we have everything you need.",
    descriptionBg: "Завършете екипировката си с първокласни аксесоари. От трапези до комплекти за ремонт - имаме всичко необходимо.",
  },
};

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();

  const category = slug || 'kites';
  const categoryInfo = categoryData[category] || categoryData.kites;
  const products = allProducts.filter(p => p.category === category);
  
  const categoryNames: Record<string, { en: string; bg: string }> = {
    kites: { en: 'Kites', bg: 'Кайтове' },
    boards: { en: 'Boards', bg: 'Дъски' },
    wings: { en: 'Wings', bg: 'Уингове' },
    foils: { en: 'Foils', bg: 'Фойлове' },
    accessories: { en: 'Accessories', bg: 'Аксесоари' },
  };

  const categoryName = categoryNames[category]?.[language] || category;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[50vh] lg:h-[60vh]">
          <img 
            src={categoryInfo.heroImage} 
            alt={categoryName} 
            className="image-cover"
          />
          <div className="hero-overlay" />
          <div className="absolute inset-0 flex items-center">
            <div className="section-container">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
                <Link to="/" className="hover:text-white transition-colors">
                  {language === 'bg' ? 'Начало' : 'Home'}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link to="/shop" className="hover:text-white transition-colors">
                  {language === 'bg' ? 'Магазин' : 'Shop'}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{categoryName}</span>
              </nav>
              
              <h1 className="text-hero text-white mb-4">{categoryName.toUpperCase()}</h1>
              <p className="text-subhero text-white/80 max-w-2xl">
                {language === 'bg' ? categoryInfo.descriptionBg : categoryInfo.descriptionEn}
              </p>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        {products.some(p => p.badge === 'New') && (
          <section className="section-container section-padding-sm border-b border-border">
            <h2 className="text-section-title mb-8">{t('category.new_arrivals')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.filter(p => p.badge === 'New').map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="section-container section-padding">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-section-title">{t('category.all_products')}</h2>
            <span className="font-body text-sm text-muted-foreground">
              {products.length} {t('shop.products')}
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
              <p className="font-body text-muted-foreground">
                {t('shop.no_results')}
              </p>
            </div>
          )}
        </section>

        {/* Category Info Cards */}
        <section className="bg-secondary/30 section-padding">
          <div className="section-container">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-background rounded-xl p-6">
                <h3 className="font-heading font-semibold mb-2">
                  {language === 'bg' ? 'Безплатна доставка' : 'Free Shipping'}
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  {language === 'bg' 
                    ? 'За всички поръчки над 200 лв.' 
                    : 'On all orders over 200 BGN'}
                </p>
              </div>
              <div className="bg-background rounded-xl p-6">
                <h3 className="font-heading font-semibold mb-2">
                  {language === 'bg' ? 'Експертна консултация' : 'Expert Advice'}
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  {language === 'bg' 
                    ? 'Нашият екип от опитни райдъри ще ви помогне' 
                    : 'Our team of experienced riders will help you'}
                </p>
              </div>
              <div className="bg-background rounded-xl p-6">
                <h3 className="font-heading font-semibold mb-2">
                  {language === 'bg' ? '2 години гаранция' : '2 Year Warranty'}
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  {language === 'bg' 
                    ? 'На всички продукти Slingshot' 
                    : 'On all Slingshot products'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Category;
