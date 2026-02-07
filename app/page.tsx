import type { Metadata } from "next";
import { businessInfo } from "@/lib/seo/business";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { resolveBaseUrl } from "@/lib/seo/url-server";
import { generateListingSEO } from "@/lib/seo/generate-listing-seo";
import { translations } from "@/lib/i18n/translations";
import { query } from "@/lib/db";
import { cookies } from "next/headers";
import HeroSection from "@/components/home/HeroSection";
import NewProductsFromCollection from "@/components/home/NewProductsFromCollection";
import ShopByCategories from "@/components/home/ShopByCategories";
import BestSellersFromCollection from "@/components/home/BestSellersFromCollection";
import ShopByKeywords from "@/components/home/ShopByKeywords";
import Newsletter from "@/components/home/Newsletter";

const normalizeLanguage = (lang?: string) => (lang === "bg" ? "bg" : "en");

const toUnique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const fetchCollectionBySlug = async (slug: string, language: "en" | "bg") => {
  const result = await query(
    `SELECT c.id, COALESCE(ct.title, c.title) as title
     FROM collections c
     LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = $2
     WHERE c.slug = $1 AND c.visible = true`,
    [slug, language]
  );

  return result.rows[0];
};

const fetchCollectionProducts = async (collectionId: string, language: "en" | "bg", limit = 12) => {
  const result = await query(
    `SELECT
        COALESCE(pt.title, p.name) as name,
        COALESCE(pt.tags, p.tags) as tags
     FROM collection_products cp
     JOIN products p ON p.id = cp.product_id
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.language_code = $2
     WHERE cp.collection_id = $1 AND p.status = 'active'
     ORDER BY cp.sort_order ASC, p.name ASC
     LIMIT $3`,
    [collectionId, language, limit]
  );

  const productNames = result.rows.map((row: any) => row.name).filter(Boolean);
  const rawTags = result.rows.flatMap((row: any) => row.tags || []);

  return {
    productNames,
    tags: rawTags,
  };
};

const resolveTagNames = async (tags: string[], language: "en" | "bg") => {
  if (tags.length === 0) return [];

  const normalized = tags.map((tag) => tag.toLowerCase());
  const result = await query(
    `SELECT name_en, name_bg
     FROM tags
     WHERE LOWER(name_en) = ANY($1)
        OR LOWER(name_bg) = ANY($1)`,
    [normalized]
  );

  return result.rows.map((row: any) => {
    if (language === "bg" && row.name_bg) return row.name_bg;
    return row.name_en;
  });
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get("lang")?.value);
  const dictionary = translations[language];

  const baseUrl = await resolveBaseUrl();
  const hreflangLinks = buildHreflangLinks(baseUrl, "/");

  const heroTitle = `${dictionary["hero.title.line1"]} ${dictionary["hero.title.accent"]}`.trim();
  const heroSubtitle = dictionary["hero.description"];

  const fallbackTitle = language === "bg"
    ? "Slingshot България | Премиум кайтове, дъски и уингове"
    : "Slingshot Bulgaria | Premium Kites, Boards & Wings";
  const fallbackDescription = language === "bg"
    ? "Пазарувайте Slingshot и Ride Engine екипировка в България. Премиум кайтове, дъски, уингове и аксесоари с експертна поддръжка."
    : "Shop Slingshot and Ride Engine gear in Bulgaria. Premium kites, boards, wings, and accessories with expert support.";

  const featuredCollectionsResult = await query(
    `SELECT COALESCE(ct.title, c.title) as title
     FROM homepage_featured_collections hfc
     JOIN collections c ON c.id = hfc.collection_id
     LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = $1
     WHERE c.visible = true
     ORDER BY hfc.sort_order ASC
     LIMIT 12`,
    [language]
  );

  const featuredCollections = featuredCollectionsResult.rows.map((row: any) => row.title);

  const keywordsResult = await query(
    `SELECT hfk.tag_name_en as name_en, t.name_bg
     FROM homepage_featured_keywords hfk
     LEFT JOIN tags t ON lower(t.name_en) = lower(hfk.tag_name_en)
     ORDER BY hfk.sort_order ASC
     LIMIT 20`,
    []
  );
  const homepageKeywords = keywordsResult.rows.map((row: any) =>
    language === "bg" && row.name_bg ? row.name_bg : row.name_en
  );

  const newProductsCollection = await fetchCollectionBySlug("featured-products", language);
  const bestSellersCollection = await fetchCollectionBySlug("best-sellers", language);

  const newProductsData = newProductsCollection
    ? await fetchCollectionProducts(newProductsCollection.id, language, 8)
    : { productNames: [], tags: [] };
  const bestSellersData = bestSellersCollection
    ? await fetchCollectionProducts(bestSellersCollection.id, language, 8)
    : { productNames: [], tags: [] };

  const combinedTags = toUnique([
    ...newProductsData.tags,
    ...bestSellersData.tags,
  ]);
  const resolvedTags = await resolveTagNames(combinedTags, language);

  const weightedTokens: Array<{ value: string; score: number }> = [];

  if (dictionary["hero.badge"]) {
    weightedTokens.push({ value: dictionary["hero.badge"], score: 9 });
  }

  weightedTokens.push(
    { value: dictionary["newProducts.title"], score: 8 },
    { value: dictionary["bestSellers.title"], score: 6 },
    { value: dictionary["shopByCategories.title"], score: 7 },
    { value: dictionary["shopByKeywords.title"], score: 5 }
  );

  featuredCollections.forEach((title, index) => {
    weightedTokens.push({ value: title, score: Math.max(6, 7 - Math.floor(index / 4)) });
  });

  newProductsData.productNames.forEach((name, index) => {
    weightedTokens.push({ value: name, score: Math.max(6, 7 - Math.floor(index / 3)) });
  });

  bestSellersData.productNames.forEach((name, index) => {
    weightedTokens.push({ value: name, score: Math.max(5, 6 - Math.floor(index / 3)) });
  });

  resolvedTags.forEach((tag, index) => {
    weightedTokens.push({ value: tag, score: Math.max(4, 5 - Math.floor(index / 5)) });
  });

  homepageKeywords.forEach((keyword, index) => {
    weightedTokens.push({ value: keyword, score: Math.max(4, 5 - Math.floor(index / 6)) });
  });

  const seo = generateListingSEO({
    language,
    heroTitle,
    heroSubtitle,
    weightedTokens,
    fallbackTitle,
    fallbackDescription,
    siteName: businessInfo.name,
  });

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: hreflangLinks.canonical,
      languages: hreflangLinks.alternates.languages,
    },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: businessInfo.url,
      siteName: businessInfo.name,
      images: [
        {
          url: "/images/og-default.jpg",
          width: 1200,
          height: 630,
          alt: businessInfo.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: ["/images/og-default.jpg"],
    },
  };
}

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
