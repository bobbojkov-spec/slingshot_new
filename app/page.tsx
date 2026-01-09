import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import BestSellers from "@/components/home/BestSellers";
import Newsletter from "@/components/home/Newsletter";

export default function Page() {
  return (
    <div className="min-h-screen">
      <div className="min-h-screen">
        <HeroSection />
        <CategoryGrid />
        <BestSellers />
        <Newsletter />
      </div>
    </div>
  );
}