
import { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';
import { buildCanonicalUrl } from '@/lib/seo/url-server';
import SchemaJsonLd from '@/components/seo/SchemaJsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/business';
import { buildMetadataFromSeo, resolvePageSEO } from '@/lib/seo/metadata';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const seo = await resolvePageSEO({ type: "shop", searchParams: params, path: "/shop" });
  return buildMetadataFromSeo(seo);
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
