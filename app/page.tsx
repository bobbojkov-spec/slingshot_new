import type { Metadata } from "next";
import { translations } from "@/lib/i18n/translations";
import { cookies } from "next/headers";
import HeroSection from "@/components/home/HeroSection";
import NewProductsFromCollection from "@/components/home/NewProductsFromCollection";
import ShopByCategories from "@/components/home/ShopByCategories";
import BestSellersFromCollection from "@/components/home/BestSellersFromCollection";
import ShopByKeywords from "@/components/home/ShopByKeywords";
import Newsletter from "@/components/home/Newsletter";
import AiVisibilitySnippet from "@/components/seo/AiVisibilitySnippet";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { buildMetadataFromSeo, resolvePageSEO } from "@/lib/seo/metadata";


export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolvePageSEO({ type: "home" });
  return buildMetadataFromSeo(seo);
}

export default async function Page() {
  const cookieStore = await cookies();
  const language = (cookieStore.get("lang")?.value || "en") === "bg" ? "bg" : "en";
  const dictionary = translations[language];
  const seo = await resolvePageSEO({ type: "home" });

  return (
    <div className="min-h-screen">
      {seo.jsonLd ? (
        Array.isArray(seo.jsonLd) ? (
          seo.jsonLd.map((schema, index) => <SchemaJsonLd key={index} data={schema} />)
        ) : (
          <SchemaJsonLd data={seo.jsonLd} />
        )
      ) : null}
      <HeroSection />
      <div className="container mx-auto px-4 py-2">
        <AiVisibilitySnippet
          page={{
            title: dictionary["hero.title.line1"] + " " + dictionary["hero.title.accent"],
            description: dictionary["hero.description"],
            type: "home",
            tags: ["home", "slingshot", "kiteboarding", "bulgaria"]
          }}
        />
      </div>
      <NewProductsFromCollection />
      <ShopByCategories />
      <BestSellersFromCollection />
      <ShopByKeywords />
      <Newsletter />
    </div>
  );
}
