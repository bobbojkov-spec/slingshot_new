
import { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';
import { buildCanonicalUrl } from '@/lib/seo/url-server';
import { buildHreflangLinks } from '@/lib/seo/hreflang';
import SchemaJsonLd from '@/components/seo/SchemaJsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/business';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : null;
  const category = typeof params.category === 'string' ? params.category : null;
  const brand = typeof params.brand === 'string' ? params.brand : (Array.isArray(params.brand) ? params.brand[0] : null);

  let title = "Shop All Products | Slingshot Bulgaria";
  let description = "Browse our extensive collection of premium kites, boards, wings, and accessories. Slingshot and Ride Engine official distributor.";

  if (q) {
    title = `Search Results for "${q}" | Slingshot Bulgaria`;
    description = `Search results for "${q}" at Slingshot Bulgaria. Find the best gear matching your search.`;
  } else if (category && brand) {
    title = `${category} by ${brand === 'ride-engine' ? 'Ride Engine' : 'Slingshot'
      } | Slingshot Bulgaria`;
    description = `Shop premium ${category} from ${brand === 'ride-engine' ? 'Ride Engine' : 'Slingshot'
      }. Best selection and prices in Bulgaria.`;
  } else if (category) {
    title = `${category} | Slingshot Bulgaria`;
    description = `Explore our ${category} collection. High-performance gear for your next session.`;
  } else if (brand) {
    title = `${brand === 'ride-engine' ? 'Ride Engine' : 'Slingshot'} Gear | Slingshot Bulgaria`;
    description = `Shop official ${brand === 'ride-engine' ? 'Ride Engine' : 'Slingshot'} equipment. Kites, boards, foils, and accessories.`;
  }

  // Construct canonical URL with query params sorted for consistency
  // Actually, standard practice is to canonicalize to the main shop page usually, OR self-canonicalize if the content is distinct (which it is for filtered views).
  // We'll mimic the logic: shop + params
  const queryParts: string[] = [];
  if (q) queryParts.push(`q=${encodeURIComponent(q)}`);
  if (brand) queryParts.push(`brand=${encodeURIComponent(brand)}`);
  if (category) queryParts.push(`category=${encodeURIComponent(category)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const canonicalPath = `/shop${queryString}`;
  const canonicalUrl = await buildCanonicalUrl(canonicalPath);
  const hreflangLinks = buildHreflangLinks(canonicalUrl.replace(/\/.+$/, ""), canonicalPath);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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
      title,
      description,
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
