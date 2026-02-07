
import { Metadata } from 'next';
import { query } from "@/lib/db";
import { ShopClient } from '@/components/shop/ShopClient';
import { buildCanonicalUrl, resolveBaseUrl } from '@/lib/seo/url-server';
import { buildHreflangLinks } from '@/lib/seo/hreflang';
import SchemaJsonLd from '@/components/seo/SchemaJsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/business';
import { generateListingSEO } from '@/lib/seo/generate-listing-seo';
import { cookies } from "next/headers";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const cookieStore = await cookies();
  const language = cookieStore.get("lang")?.value || "en";
  const q = typeof params.q === 'string' ? params.q : null;
  const category = typeof params.category === 'string' ? params.category : null;
  const brand = typeof params.brand === 'string' ? params.brand : (Array.isArray(params.brand) ? params.brand[0] : null);

  let title = language === "bg"
    ? "Магазин | Slingshot България"
    : "Shop All Products | Slingshot Bulgaria";
  let description = language === "bg"
    ? "Разгледайте богатата ни колекция от кайтове, дъски, уингове и аксесоари. Официален дистрибутор на Slingshot и Ride Engine."
    : "Browse our extensive collection of premium kites, boards, wings, and accessories. Slingshot and Ride Engine official distributor.";

  if (q) {
    title = language === "bg"
      ? `Резултати за "${q}" | Slingshot България`
      : `Search Results for "${q}" | Slingshot Bulgaria`;
    description = language === "bg"
      ? `Резултати за "${q}" в Slingshot България. Намерете най-доброто оборудване по търсенето.`
      : `Search results for "${q}" at Slingshot Bulgaria. Find the best gear matching your search.`;
  } else if (category && brand) {
    const brandName = brand === 'ride-engine' ? 'Ride Engine' : 'Slingshot';
    title = language === "bg"
      ? `${category} от ${brandName} | Slingshot България`
      : `${category} by ${brandName} | Slingshot Bulgaria`;
    description = language === "bg"
      ? `Пазарувайте премиум ${category} от ${brandName}. Най-добрата селекция в България.`
      : `Shop premium ${category} from ${brandName}. Best selection and prices in Bulgaria.`;
  } else if (category) {
    title = language === "bg"
      ? `${category} | Slingshot България`
      : `${category} | Slingshot Bulgaria`;
    description = language === "bg"
      ? `Разгледайте нашата ${category} колекция. Високопроизводително оборудване за следващата ви сесия.`
      : `Explore our ${category} collection. High-performance gear for your next session.`;
  } else if (brand) {
    const brandName = brand === 'ride-engine' ? 'Ride Engine' : 'Slingshot';
    title = language === "bg"
      ? `${brandName} екипировка | Slingshot България`
      : `${brandName} Gear | Slingshot Bulgaria`;
    description = language === "bg"
      ? `Пазарувайте официална ${brandName} екипировка – кайтове, дъски, фойлове и аксесоари.`
      : `Shop official ${brandName} equipment. Kites, boards, foils, and accessories.`;
  }

  let facetCollections: string[] = [];
  let facetTags: string[] = [];

  if (brand) {
    try {
      const facetQuery = `
        SELECT
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT COALESCE(ct.title, col.title)), NULL) AS collections,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.name), NULL) AS tags
        FROM products p
        JOIN collection_products cp ON cp.product_id = p.id
        JOIN collections col ON col.id = cp.collection_id
        LEFT JOIN collection_translations ct ON ct.collection_id = col.id AND ct.language_code = $1
        LEFT JOIN LATERAL unnest(COALESCE(p.tags, '{}')) as t(tag) ON true
        LEFT JOIN tags tg ON LOWER(tg.name_en) = LOWER(t.tag) OR LOWER(tg.name_bg) = LOWER(t.tag)
        WHERE p.status = 'active'
          AND LOWER(REPLACE(p.brand, ' ', '-')) = $2
      `;
      const facetResult = await query(facetQuery, [language === "bg" ? "bg" : "en", brand.toLowerCase()]);
      facetCollections = facetResult.rows?.[0]?.collections || [];
      facetTags = facetResult.rows?.[0]?.tags || [];
    } catch (error) {
      console.warn("[shop metadata] Failed to load facets", error);
    }
  }

  const descriptionWithFacets = facetCollections.length || facetTags.length
    ? `${description} ${[...facetCollections.slice(0, 6), ...facetTags.slice(0, 6)].join(', ')}.`
    : description;

  const seo = generateListingSEO({
    language: language === "bg" ? "bg" : "en",
    heroTitle: title,
    heroSubtitle: descriptionWithFacets,
    categoryNames: category ? [category] : [],
    collectionNames: facetCollections,
    tags: facetTags,
    brand: brand === 'ride-engine' ? 'Ride Engine' : brand === 'slingshot' ? 'Slingshot' : undefined,
    fallbackTitle: title,
    fallbackDescription: descriptionWithFacets,
  });

  // Construct canonical URL with query params sorted for consistency
  // Actually, standard practice is to canonicalize to the main shop page usually, OR self-canonicalize if the content is distinct (which it is for filtered views).
  // We'll mimic the logic: shop + params
  const queryParts: string[] = [];
  if (q) queryParts.push(`q=${encodeURIComponent(q)}`);
  if (brand) queryParts.push(`brand=${encodeURIComponent(brand)}`);
  if (category) queryParts.push(`category=${encodeURIComponent(category)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const canonicalPath = `/shop${queryString}`;
  const baseUrl = await resolveBaseUrl();
  const hreflangLinks = buildHreflangLinks(baseUrl, canonicalPath);

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: hreflangLinks.canonical,
      type: 'website',
      images: [
        {
          url: '/images/og-default.jpg',
          width: 1200,
          height: 630,
          alt: title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: ['/images/og-default.jpg'],
    },
    alternates: {
      canonical: hreflangLinks.canonical,
      languages: hreflangLinks.alternates.languages,
    },
  };
}

export default async function ShopPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const canonicalPath = '/shop'; // For schema, we might just point to shop? Or self.
  // Let's use clean shop for breadcrumb root
  const canonicalUrl = await buildCanonicalUrl(canonicalPath);
  const baseUrl = canonicalUrl.replace(/\/$/, "");

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" }
    // We could add more specific breadcrumbs here based on params inside this server component, 
    // but the Client component also does it. 
    // For schema, we should replicate it.
  ];

  const breadcrumbSchema = buildBreadcrumbSchema(baseUrl, breadcrumbItems);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Shop",
    description: "Slingshot Bulgaria Shop",
    url: await buildCanonicalUrl(`/shop`)
  };

  return (
    <>
      <SchemaJsonLd data={breadcrumbSchema} />
      <SchemaJsonLd data={pageSchema} />
      <ShopClient />
    </>
  );
}
