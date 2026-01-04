import Header from "@/components/Header";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import BestSellers from "@/components/home/BestSellers";
import Newsletter from "@/components/home/Newsletter";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <CategoryGrid />
        <BestSellers />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}