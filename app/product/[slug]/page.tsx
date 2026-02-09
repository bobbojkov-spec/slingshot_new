
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/services/products";
import { ProductDetailsClient } from "@/components/products/ProductDetailsClient";
import { buildBreadcrumbSchema, businessInfo } from "@/lib/seo/business";
import { buildCanonicalUrl } from "@/lib/seo/url-server";
import type { Metadata } from "next";
import { buildMetadataFromSeo, resolvePageSEO } from "@/lib/seo/metadata";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import AiVisibilitySnippet from "@/components/seo/AiVisibilitySnippet";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seo = await resolvePageSEO({ type: "product", slug, path: `/product/${slug}` });
  return buildMetadataFromSeo(seo);
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
      <div className="container mx-auto px-4 py-2">
        <AiVisibilitySnippet
          page={{
            title: product.title || product.name,
            description: product.description,
            type: "product",
            tags: [product.product_type || "gear", product.brand || "slingshot"]
          }}
        />
      </div>
      <ProductDetailsClient product={product} related={related} />
    </>
  );
}
