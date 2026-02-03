import HeroSection from "@/components/home/HeroSection";
import NewProductsFromCollection from "@/components/home/NewProductsFromCollection";
import ShopByCategories from "@/components/home/ShopByCategories";
import BestSellersFromCollection from "@/components/home/BestSellersFromCollection";
import ShopByKeywords from "@/components/home/ShopByKeywords";
import Newsletter from "@/components/home/Newsletter";

export default function Page() {
  return (
    <div className="min-h-screen">
      <div className="min-h-screen">
        <HeroSection />
        <NewProductsFromCollection />
        <ShopByCategories />
        <BestSellersFromCollection />
        <ShopByKeywords />
        <Newsletter />
      </div>
    </div>
  );
}
