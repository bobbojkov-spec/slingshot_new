import "server-only";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveBaseUrl } from "@/lib/seo/url-server";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { businessInfo } from "@/lib/seo/business";
import { generateListingSEO } from "@/lib/seo/generate-listing-seo";
import { generateDynamicSEO } from "@/lib/seo/generate-dynamic-seo";
import { getProductBySlug } from "@/services/products";
import { getCollectionBySlug } from "@/services/collections";
import { getPageBySlug } from "@/lib/db/repositories/pages";
import { translations } from "@/lib/i18n/translations";

export type SeoLocale = "en" | "bg";
export type SeoRouteType =
  | "home"
  | "page"
  | "product"
  | "collection"
  | "shop"
  | "category"
  | "search"
  | "brandCollections"
  | "inquiry"
  | "fallback";

export interface SeoInput {
  type: SeoRouteType;
  slug?: string;
  params?: Record<string, string | undefined>;
  searchParams?: Record<string, string | string[] | undefined>;
  locale?: SeoLocale;
  path?: string;
}

export interface SeoResolved {
  title: string;
  description: string;
  canonical: string;
  ogImageUrl: string;
  ogType: "website" | "article";
  robots?: Metadata["robots"];
  alternates?: Metadata["alternates"];
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const FALLBACK_OG_PATH = "/og-default.jpg";

const normalizeLocale = (locale?: string): SeoLocale => (locale === "bg" ? "bg" : "en");

const stripHtml = (value?: string | null) =>
  (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const truncate = (value: string, max = 160) => {
  if (!value) return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trim()}...`;
};

const getLocale = async (explicit?: SeoLocale) => {
  if (explicit) return normalizeLocale(explicit);
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get("lang")?.value);
};

const toQueryValue = (value: string | string[] | undefined) => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const sanitizeSearchParams = (searchParams?: Record<string, string | string[] | undefined>) => {
  if (!searchParams) return "";
  const allowed = new Set(["brand", "collection", "tag", "tags", "category", "sort", "q"]);
  const pairs: string[] = [];
  Object.entries(searchParams).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    if (!allowed.has(normalizedKey)) return;
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => pairs.push(`${normalizedKey}=${encodeURIComponent(item)}`));
    } else {
      pairs.push(`${normalizedKey}=${encodeURIComponent(value)}`);
    }
  });
  return pairs.length ? `?${pairs.join("&")}` : "";
};

const buildOgUrl = (baseUrl: string, params: Record<string, string | undefined>) => {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/og`);
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const fallbackDescription = (locale: SeoLocale) =>
  locale === "bg"
    ? "Премиум екипировка за кайт, уинг и фойл спортове в България."
    : "Premium kite, wing, and foil gear curated for riders in Bulgaria.";

const buildDefaultResolved = async (
  locale: SeoLocale,
  path = "/",
  title = businessInfo.name,
  description = fallbackDescription(locale)
): Promise<SeoResolved> => {
  const baseUrl = await resolveBaseUrl();
  const hreflang = buildHreflangLinks(baseUrl, path);
  const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

  return {
    title,
    description: truncate(description, 160),
    canonical: hreflang.canonical,
    ogImageUrl,
    ogType: "website",
    alternates: {
      canonical: hreflang.canonical,
      languages: hreflang.alternates.languages,
    },
  };
};

const buildProductJsonLd = (product: any, canonical: string) => {
  if (!product) return undefined;
  const images = Array.isArray(product.images) ? product.images : product.image ? [product.image] : [];
  const offers = product.price
    ? {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: canonical,
    }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || product.name,
    description: stripHtml(product.description || product.description_bg),
    sku: product.sku || undefined,
    brand: product.brand
      ? {
        "@type": "Brand",
        name: product.brand,
      }
      : undefined,
    image: images.length ? images : undefined,
    category: product.category_name || undefined,
    url: canonical,
    offers,
  };
};

const buildCollectionJsonLd = (collection: any, canonical: string, locale: SeoLocale, baseUrl: string) => {
  if (!collection) return undefined;
  const items = Array.isArray(collection.products)
    ? collection.products.slice(0, 10).map((product: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl.replace(/\/$/, "")}/product/${product.slug}`,
      name: product.name,
    }))
    : [];

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: stripHtml(collection.description) || fallbackDescription(locale),
    url: canonical,
    image: collection.image_url || undefined,
    mainEntity: items.length
      ? {
        "@type": "ItemList",
        itemListElement: items,
      }
      : undefined,
  };
};

const resolveProductDescription = (product: any, locale: SeoLocale) => {
  const raw = locale === "bg"
    ? product.description_html_bg || product.description_bg || product.description_html || product.description
    : product.description_html || product.description;
  const clean = stripHtml(raw);
  if (clean) return truncate(clean, 160);
  const fallback = locale === "bg"
    ? `Разгледайте ${product.title || product.name} в Slingshot Bulgaria.`
    : `Explore ${product.title || product.name} at Slingshot Bulgaria.`;
  return truncate(fallback, 160);
};

const buildShopJsonLd = (title: string, description: string, canonical: string) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: canonical,
});

export async function resolvePageSEO(input: SeoInput): Promise<SeoResolved> {
  const locale = await getLocale(input.locale);
  const baseUrl = await resolveBaseUrl();
  const path = input.path || "/";

  if (input.type === "home") {
    const dictionary = translations[locale];
    const heroTitle = `${dictionary["hero.title.line1"]} ${dictionary["hero.title.accent"]}`.trim();
    const heroSubtitle = dictionary["hero.description"] || fallbackDescription(locale);

    const seo = generateListingSEO({
      language: locale,
      heroTitle,
      heroSubtitle,
      fallbackTitle: "Slingshot Bulgaria | Premium Kite, Wing & Foil Gear",
      fallbackDescription: heroSubtitle,
      siteName: businessInfo.name,
    });

    const hreflang = buildHreflangLinks(baseUrl, "/");
    const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

    return {
      title: seo.title,
      description: seo.description,
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildShopJsonLd(seo.title, seo.description, hreflang.canonical),
    };
  }

  if (input.type === "product" && input.slug) {
    const result = await getProductBySlug(input.slug);
    if (!result?.product) {
      return buildDefaultResolved(
        locale,
        `/product/${input.slug}`,
        locale === "bg" ? "Продуктът не е намерен | Slingshot Bulgaria" : "Product Not Found | Slingshot Bulgaria",
        fallbackDescription(locale)
      );
    }

    const { product } = result;
    const canonicalPath = `/product/${product.slug}`;
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const ogImageUrl = buildOgUrl(baseUrl, {
      type: "product",
      slug: product.slug,
      locale,
    });

    const description = resolveProductDescription(product, locale);

    return {
      title: `${product.title || product.name} | ${product.category_name || "Gear"} | Slingshot Bulgaria`,
      description,
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildProductJsonLd(product, hreflang.canonical),
    };
  }

  if (input.type === "collection" && input.slug) {
    const collection = await getCollectionBySlug(input.slug, locale);
    if (!collection) {
      return buildDefaultResolved(
        locale,
        `/collections/${input.slug}`,
        locale === "bg" ? "Колекцията не е намерена | Slingshot Bulgaria" : "Collection Not Found | Slingshot Bulgaria",
        fallbackDescription(locale)
      );
    }

    const description = stripHtml(collection.description) || fallbackDescription(locale);
    const seo = generateListingSEO({
      language: locale,
      heroTitle: collection.title,
      heroSubtitle: collection.subtitle || description,
      collectionNames: [collection.title],
      brand: collection.source === "rideengine" ? "Ride Engine" : "Slingshot",
      fallbackTitle: `${collection.title} | Slingshot Bulgaria`,
      fallbackDescription: description,
    });

    const canonicalPath = `/collections/${collection.slug}`;
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const ogImageUrl = buildOgUrl(baseUrl, {
      type: "collection",
      slug: collection.slug,
      locale,
    });

    return {
      title: `${collection.title} | Slingshot Bulgaria`,
      description: truncate(seo.description, 160),
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildCollectionJsonLd(collection, hreflang.canonical, locale, baseUrl),
    };
  }

  if (input.type === "page" && input.slug) {
    const page = await getPageBySlug(input.slug);
    if (!page || page.status !== "published") {
      return buildDefaultResolved(
        locale,
        `/${input.slug}`,
        locale === "bg" ? "Страницата не е намерена | Slingshot Bulgaria" : "Page Not Found | Slingshot Bulgaria",
        fallbackDescription(locale)
      );
    }

    const title =
      locale === "bg" && page.title_bg
        ? page.title_bg
        : page.seo_title || page.title;
    const description =
      locale === "bg"
        ? page.seo_description || page.content_bg || page.content || fallbackDescription(locale)
        : page.seo_description || page.content || fallbackDescription(locale);

    const canonicalPath = page.canonical_url || `/${page.slug}`;
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

    return {
      title: `${title} | Slingshot Bulgaria`,
      description: truncate(stripHtml(description), 160),
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildShopJsonLd(title, truncate(stripHtml(description), 160), hreflang.canonical),
    };
  }

  if (input.type === "shop") {
    const searchParams = input.searchParams;
    const brand = toQueryValue(searchParams?.brand);
    const collection = toQueryValue(searchParams?.collection);
    const tags = toQueryValue(searchParams?.tags) || toQueryValue(searchParams?.tag);
    const category = toQueryValue(searchParams?.category);
    const q = toQueryValue(searchParams?.q);

    let title = locale === "bg" ? "Магазин | Slingshot България" : "Shop | Slingshot Bulgaria";
    let description = locale === "bg"
      ? "Разгледайте пълната селекция от Slingshot и Ride Engine екипировка."
      : "Browse the full selection of Slingshot and Ride Engine gear.";

    if (q) {
      title = locale === "bg" ? `Търсене: ${q} | Slingshot България` : `Search: ${q} | Slingshot Bulgaria`;
      description = locale === "bg"
        ? `Резултати за "${q}" в Slingshot Bulgaria.`
        : `Search results for "${q}" at Slingshot Bulgaria.`;
    } else if (brand || collection || tags || category) {
      const parts = [brand, collection, tags, category].filter(Boolean).join(" ");
      title = locale === "bg" ? `Магазин ${parts} | Slingshot България` : `Shop ${parts} | Slingshot Bulgaria`;
      description = locale === "bg"
        ? `Филтрирана селекция: ${parts}.`
        : `Filtered selection: ${parts}.`;
    }

    const seo = generateListingSEO({
      language: locale,
      heroTitle: title,
      heroSubtitle: description,
      fallbackTitle: title,
      fallbackDescription: description,
    });

    const canonicalPath = `/shop${sanitizeSearchParams(searchParams)}`;
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

    return {
      title: seo.title,
      description: truncate(seo.description, 160),
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildShopJsonLd(seo.title, seo.description, hreflang.canonical),
    };
  }

  if (input.type === "category" && input.slug) {
    const canonicalPath = `/category/${input.slug}`;
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const title = `${input.slug} | Slingshot Bulgaria`;
    const description = fallbackDescription(locale);
    const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

    return {
      title,
      description: truncate(description, 160),
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildShopJsonLd(title, description, hreflang.canonical),
    };
  }

  if (input.type === "brandCollections" && input.slug) {
    const title =
      input.slug === "rideengine"
        ? locale === "bg"
          ? "Колекции Ride Engine | Slingshot България"
          : "Ride Engine Collections | Slingshot Bulgaria"
        : locale === "bg"
          ? "Колекции Slingshot | Slingshot България"
          : "Slingshot Collections | Slingshot Bulgaria";
    const description =
      input.slug === "rideengine"
        ? locale === "bg"
          ? "Разгледайте колекциите Ride Engine."
          : "Explore Ride Engine collections."
        : locale === "bg"
          ? "Разгледайте всички Slingshot колекции."
          : "Explore all Slingshot collections.";

    const canonicalPath = input.slug === "rideengine" ? "/rideengine-collections" : "/slingshot-collections";
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

    return {
      title,
      description: truncate(description, 160),
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildShopJsonLd(title, description, hreflang.canonical),
    };
  }

  if (input.type === "search") {
    const queryText = toQueryValue(input.searchParams?.q) || "";
    const title =
      locale === "bg"
        ? `Резултати за "${queryText}" | Slingshot България`
        : `Search Results for "${queryText}" | Slingshot Bulgaria`;
    const description =
      locale === "bg"
        ? `Резултати от търсенето за "${queryText}" в Slingshot Bulgaria.`
        : `Search results for "${queryText}" at Slingshot Bulgaria.`;
    const canonicalPath = `/search?q=${encodeURIComponent(queryText)}`;
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

    return {
      title,
      description: truncate(description, 160),
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildShopJsonLd(title, description, hreflang.canonical),
    };
  }

  if (input.type === "inquiry") {
    const slug = input.slug || "contact";
    const title =
      slug === "success"
        ? locale === "bg"
          ? "Запитването е изпратено! | Slingshot Bulgaria"
          : "Inquiry Sent! | Slingshot Bulgaria"
        : slug === "summary"
          ? locale === "bg"
            ? "Вашите продукти | Slingshot Bulgaria"
            : "Your Items | Slingshot Bulgaria"
          : locale === "bg"
            ? "Данни за контакт | Slingshot Bulgaria"
            : "Contact Details | Slingshot Bulgaria";
    const description =
      slug === "success"
        ? locale === "bg"
          ? "Благодарим ви! Ще се свържем с вас възможно най-скоро."
          : "Thank you! We will contact you as soon as possible."
        : slug === "summary"
          ? locale === "bg"
            ? "Преглед на вашите избрани продукти."
            : "Review your selected products."
          : locale === "bg"
            ? "Изпратете запитване за наличност и цени."
            : "Send an inquiry for availability and pricing.";

    const canonicalPath = `/inquiry/${slug}`;
    const hreflang = buildHreflangLinks(baseUrl, canonicalPath);
    const ogImageUrl = `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;

    return {
      title,
      description: truncate(description, 160),
      canonical: hreflang.canonical,
      ogImageUrl,
      ogType: "website",
      alternates: {
        canonical: hreflang.canonical,
        languages: hreflang.alternates.languages,
      },
      jsonLd: buildShopJsonLd(title, description, hreflang.canonical),
    };
  }

  return buildDefaultResolved(locale, path, businessInfo.name, fallbackDescription(locale));
}

export const buildMetadataFromSeo = (seo: SeoResolved): Metadata => {
  const images = [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: seo.title }];

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      type: seo.ogType as any,
      siteName: businessInfo.name,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images,
    },
    alternates: seo.alternates,
    robots: seo.robots,
  };
};

export const resolveOgFallbackImage = (baseUrl: string) => {
  if (FALLBACK_OG_PATH.startsWith("http")) return FALLBACK_OG_PATH;
  return `${baseUrl.replace(/\/$/, "")}${FALLBACK_OG_PATH}`;
};