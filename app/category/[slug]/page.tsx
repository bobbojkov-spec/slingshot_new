import { cookies } from "next/headers";
import { Metadata } from "next";
import { buildCanonicalUrl, resolveBaseUrl } from "@/lib/seo/url-server";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { buildBreadcrumbSchema } from "@/lib/seo/business";
import { CategoryClient } from "@/components/shop/CategoryClient";
import { generateListingSEO } from "@/lib/seo/generate-listing-seo";

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

interface PageProps {
  params: Promise<{ slug?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const category = resolvedParams?.slug || "kites";
  const cookieStore = await cookies();
  const language = cookieStore.get("lang")?.value || "en";

  const categoryInfo = categoryData[category] || categoryData.kites;
  const categoryName = language === "bg" ? categoryNames[category]?.bg ?? category : categoryNames[category]?.en ?? category;
  const description = language === "bg" ? categoryInfo.descriptionBg : categoryInfo.descriptionEn;

  const canonicalPath = `/category/${category}`;
  const baseUrl = await resolveBaseUrl();
  const hreflangLinks = buildHreflangLinks(baseUrl, canonicalPath);

  const seo = generateListingSEO({
    language: language === "bg" ? "bg" : "en",
    heroTitle: categoryName,
    heroSubtitle: description,
    categoryNames: [categoryName],
    tags: [],
    productTypes: [],
    productNames: [],
    brand: "Slingshot",
    fallbackTitle: `${categoryName} | Slingshot Bulgaria`,
    fallbackDescription: description,
  });

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: hreflangLinks.canonical,
      siteName: "Slingshot Bulgaria",
      type: "website",
      images: [
        {
          url: categoryInfo.heroImage,
          width: 1200,
          height: 630,
          alt: categoryName,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [categoryInfo.heroImage],
    },
    alternates: {
      canonical: hreflangLinks.canonical,
      languages: hreflangLinks.alternates.languages,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const category = resolvedParams?.slug || "kites";
  const cookieStore = await cookies();
  const language = (cookieStore.get("lang")?.value || "en") as "en" | "bg";

  const categoryInfo = categoryData[category] || categoryData.kites;
  const products = allProducts.filter((product) => product.category === category);
  const categoryName = language === "bg" ? categoryNames[category]?.bg ?? category : categoryNames[category]?.en ?? category;
  const description = language === "bg" ? categoryInfo.descriptionBg : categoryInfo.descriptionEn;

  const canonicalPath = `/category/${category}`;
  const baseUrl = await resolveBaseUrl();
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  const breadcrumbItems = [
    { label: language === "bg" ? "Начало" : "Home", href: "/" },
    { label: language === "bg" ? "Магазин" : "Shop", href: "/shop" },
    { label: categoryName }
  ];

  const breadcrumbSchema = buildBreadcrumbSchema(baseUrl, breadcrumbItems);
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: categoryName,
    url: canonicalUrl,
    description,
  };

  return (
    <>
      <SchemaJsonLd data={breadcrumbSchema} />
      <SchemaJsonLd data={pageSchema} />
      <CategoryClient
        category={category}
        categoryName={categoryName}
        description={description}
        heroImage={categoryInfo.heroImage}
        products={products}
      />
    </>
  );
}

