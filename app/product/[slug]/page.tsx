
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/services/products";
import { ProductDetailsClient } from "@/components/products/ProductDetailsClient";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { buildBreadcrumbSchema, businessInfo } from "@/lib/seo/business";
import { buildCanonicalUrl, resolveBaseUrl } from "@/lib/seo/url-server";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import type { Metadata } from "next";
import { cookies } from "next/headers";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";
  const result = await getProductBySlug(slug);

  const canonicalPath = `/product/${slug}`;
  const baseUrl = await resolveBaseUrl();
  const hreflangLinks = buildHreflangLinks(baseUrl, canonicalPath);

  if (!result || !result.product) {
    return {
      title: 'Product Not Found | Slingshot Sports',
      alternates: {
        canonical: hreflangLinks.canonical,
        languages: hreflangLinks.alternates.languages,
      },
    };
  }

  const { product } = result;
  const title = `${product.title || product.name} | Slingshot Sports`;
  const description = (product.description_bg && lang === 'bg' ? product.description_bg : product.description)
    || (lang === 'bg' ? `Разгледайте ${product.name} в Slingshot Bulgaria.` : `Check out ${product.name} at Slingshot Bulgaria.`);
  const cleanDescription = description.replace(/<[^>]*>?/gm, '').slice(0, 160);
  const images = product.image ? [{ url: product.image, width: 1200, height: 630, alt: product.title }] : [];

  return {
    title,
    description: cleanDescription,
    openGraph: {
      title,
      description: cleanDescription,
      url: hreflangLinks.canonical,
      images,
      type: 'website',
      siteName: 'Slingshot Bulgaria',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cleanDescription,
      images,
    },
    alternates: {
      canonical: hreflangLinks.canonical,
      languages: hreflangLinks.alternates.languages,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch data on the server
  const result = await getProductBySlug(slug);

  if (!result || !result.product) {
    notFound();
  }

  const { product, related } = result;

  // Generate JSON-LD Schema
  const canonicalPath = `/product/${slug}`;
  const canonicalUrl = await buildCanonicalUrl(canonicalPath);
  const baseUrl = canonicalUrl.replace(/\/.+$/, "");

  // Breadcrumb Schema
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: product.name }
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(baseUrl, breadcrumbItems);

  // Product Schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || product.name,
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || "Slingshot"
    },
    image: product.images || (product.image ? [product.image] : []),
    category: product.category_name,
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR", // Assuming Euro based on locale, or check business logic
      availability: "https://schema.org/InStock",
      url: canonicalUrl
    }
  };

  return (
    <>
      <SchemaJsonLd data={breadcrumbSchema} />
      <SchemaJsonLd data={productSchema} />
      <ProductDetailsClient product={product} related={related} />
    </>
  );
}
