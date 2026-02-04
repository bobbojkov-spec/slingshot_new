import type { Metadata } from "next";
import { businessInfo } from "@/lib/seo/business";
import HeroSection from "@/components/home/HeroSection";
import NewProductsFromCollection from "@/components/home/NewProductsFromCollection";
import ShopByCategories from "@/components/home/ShopByCategories";
import BestSellersFromCollection from "@/components/home/BestSellersFromCollection";
import ShopByKeywords from "@/components/home/ShopByKeywords";
import Newsletter from "@/components/home/Newsletter";

export const metadata: Metadata = {
  title: "Slingshot Bulgaria | Premium Kites, Boards & Wings",
  description:
    "Shop Slingshot and Ride Engine gear in Bulgaria. Premium kites, boards, wings, and accessories with expert support.",
  openGraph: {
    title: "Slingshot Bulgaria | Premium Kites, Boards & Wings",
    description:
      "Shop Slingshot and Ride Engine gear in Bulgaria. Premium kites, boards, wings, and accessories with expert support.",
    url: businessInfo.url,
    siteName: "Slingshot Bulgaria",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slingshot Bulgaria | Premium Kites, Boards & Wings",
    description:
      "Shop Slingshot and Ride Engine gear in Bulgaria. Premium kites, boards, wings, and accessories with expert support.",
  },
};

export default function Page() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <NewProductsFromCollection />
      <ShopByCategories />
      <BestSellersFromCollection />
      <ShopByKeywords />
      <Newsletter />
    </div>
  );
}
