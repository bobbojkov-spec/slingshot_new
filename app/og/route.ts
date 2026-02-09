import { ImageResponse } from "next/og";
import { resolveBaseUrl } from "@/lib/seo/url-server";
import { resolveOgFallbackImage } from "@/lib/seo/metadata";
import { getProductBySlug } from "@/services/products";
import { getCollectionBySlug, getCollectionsByBrand } from "@/services/collections";
import { getPageBySlug } from "@/lib/db/repositories/pages";
import { translations } from "@/lib/i18n/translations";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

const fallbackGradient = {
  backgroundImage: "linear-gradient(135deg, #04111f, #0f2c46 55%, #18f2a4)",
};

const normalizeLocale = (locale?: string) => (locale === "bg" ? "bg" : "en");

const safeFetchImage = async (url?: string | null) => {
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch (error) {
    return null;
  }
};

const getFallbackImage = async (baseUrl: string) => {
  const fallbackUrl = resolveOgFallbackImage(baseUrl);
  return safeFetchImage(fallbackUrl);
};

const buildTitle = (type: string | null, title: string) => {
  if (!type) return title;
  return `${title}`;
};

const buildSubtitle = (subtitle?: string | null, extra?: string | null) => {
  const parts = [subtitle, extra].filter(Boolean);
  return parts.join(" • ");
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "page";
  const slug = searchParams.get("slug") || "";
  const locale = normalizeLocale(searchParams.get("locale") || "en");
  const baseUrl = await resolveBaseUrl();

  let title = "Slingshot Bulgaria";
  let subtitle = locale === "bg" ? "Премиум кайт и уинг екипировка" : "Premium Kite, Wing & Foil Gear";
  let imageUrl: string | null = null;
  let brand: string | null = null;
  let price: string | null = null;

  if (type === "product" && slug) {
    const result = await getProductBySlug(slug);
    const product = result?.product;
    if (product) {
      title = product.title || product.name;
      subtitle = product.category_name || subtitle;
      brand = product.brand || null;
      if (product.price) {
        price = `${product.price} EUR`;
      }
      imageUrl = product.hero_image_url || product.image || product.images?.[0] || null;
    }
  }

  if (type === "collection" && slug) {
    const collection = await getCollectionBySlug(slug, locale);
    if (collection) {
      title = collection.title;
      subtitle = collection.subtitle || collection.description || subtitle;
      brand = collection.source === "rideengine" ? "Ride Engine" : "Slingshot";
      imageUrl = collection.image_url || null;
    }
  }

  if (type === "brand" && slug) {
    const brandName = slug === "rideengine" ? "Ride Engine" : "Slingshot";
    title = `${brandName} Collections`;
    subtitle = locale === "bg" ? "Подбрани колекции" : "Curated collections";
    brand = brandName;
    try {
      const collections = await getCollectionsByBrand(slug, locale);
      imageUrl = collections?.[0]?.image_url || null;
    } catch (error) {
      imageUrl = null;
    }
  }

  if (type === "page" && slug) {
    const page = await getPageBySlug(slug);
    if (page) {
      title = locale === "bg" && page.title_bg ? page.title_bg : page.title;
      subtitle = page.subtitle_bg && locale === "bg" ? page.subtitle_bg : page.subtitle_en || subtitle;
      imageUrl = page.signed_hero_image_url || page.hero_image_url || null;
    }
  }

  if (type === "shop") {
    const brandParam = searchParams.get("brand");
    const collectionParam = searchParams.get("collection");
    title = locale === "bg" ? "Магазин" : "Shop";
    subtitle = [brandParam, collectionParam].filter(Boolean).join(" • ") || subtitle;
    imageUrl = null;
  }

  if (type === "search") {
    const q = searchParams.get("q") || "";
    title = locale === "bg" ? `Търсене: ${q}` : `Search: ${q}`;
    subtitle = locale === "bg" ? "Резултати от търсене" : "Search results";
  }

  if (type === "inquiry") {
    const dictionary = translations[locale];
    if (slug === "summary") {
      title = dictionary["inquiry.yourItems"] || title;
      subtitle = dictionary["inquiry.progressLabel"] || subtitle;
    } else if (slug === "success") {
      title = dictionary["inquiry.success.title"] || title;
      subtitle = dictionary["inquiry.success.message"] || subtitle;
    } else {
      title = dictionary["inquiry.contactPage.title"] || title;
      subtitle = dictionary["inquiry.contactPage.helper"] || subtitle;
    }
  }

  const imageBuffer = (await safeFetchImage(imageUrl)) || (await getFallbackImage(baseUrl));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Inter, Arial, sans-serif",
          color: "white",
          background: imageBuffer ? "#04111f" : fallbackGradient.backgroundImage,
        }}
      >
        {imageBuffer ? (
          <img
            src={imageBuffer ? imageBuffer : undefined}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.6)",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(3,15,27,0.92) 10%, rgba(3,15,27,0.6) 45%, rgba(24,242,164,0.3) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase" }}>Slingshot Bulgaria</div>
            {brand ? (
              <div style={{ fontSize: 20, color: "#18f2a4" }}>{brand}</div>
            ) : null}
          </div>
          <div style={{ maxWidth: 900 }}>
            <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{buildTitle(type, title)}</div>
            <div style={{ marginTop: 20, fontSize: 28, color: "#dbe8f5" }}>{buildSubtitle(subtitle, price)}</div>
          </div>
          <div style={{ fontSize: 18, color: "#18f2a4" }}>slingshot.bg</div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}