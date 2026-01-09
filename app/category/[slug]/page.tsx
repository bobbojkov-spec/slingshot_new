import { query } from "@/lib/db";
import { getProxyUrl } from "@/lib/utils/imagePaths";
import CategoryClientWrapper from "./CategoryClientWrapper";

// Define strict types for our DB result rows
interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  original_price: string | number | null;
  image_path: string | null;
  og_image_url: string | null;
  category_name: string;
  total_inventory: string | number | null;
  badge: string | null;
}

async function getCategoryData(slug: string, lang: string) {
  // 1. Fetch products
  const productsSql = `
    SELECT
      p.id,
      COALESCE(pt_t.title, p.name) as name,
      p.slug,
      p.og_image_url,
      (SELECT price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as price,
      (SELECT compare_at_price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as original_price,
      (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id AND pir.size = 'small' ORDER BY display_order ASC LIMIT 1) as image_path,
      COALESCE(ct.name, c.name) as category_name,
      (
        SELECT SUM(inventory_quantity) 
        FROM product_variants pv 
        WHERE pv.product_id = p.id
      ) as total_inventory
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $2
    LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $2
    WHERE c.slug = $1
    AND p.status = 'active'
    ORDER BY p.name ASC
  `;

  const { rows: products } = await query(productsSql, [slug, lang]);

  // Process products (parsing numbers, proxy urls)
  const processedProducts = products.map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category_name, // Prop for ProductCard
    price: parseFloat(row.price || '0'),
    originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
    image: row.image_path ? getProxyUrl(row.image_path) : (row.og_image_url || '/placeholder.jpg'),
    slug: row.slug,
    badge: undefined,
    inStock: (parseInt(row.total_inventory || '0') > 0)
  }));

  // 2. Fetch Category Info (Hero, Description)
  return { products: processedProducts };
}

// Keep the hardcoded hero data for now as it's not in DB schema yet
const categoryHeroData: Record<string, { heroImage: string; descriptionEn: string; descriptionBg: string; }> = {
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

export default async function Page({ params, searchParams }: { params: Promise<{ slug?: string }>, searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await params;
  const categorySlug = resolvedParams?.slug || "kites";

  // Note: Server Components don't have access to context directly for initial render language
  // But we can check a cookie or default to 'en'. For simplicity in this hybrid app, 
  // we might default to EN on server and let client hydrate?
  // OR we can't use `useLanguage` hook here because it's a server component (Wait! The original file was "use client").
  //
  // CRITICAL DECISION: The original file was "use client".
  // To use DB queries, we MUST be a Server Component OR use an API route.
  // Converting to Server Component is better for SEO and performance.
  // BUT `useLanguage` is a client hook.
  //
  // Strategy: 
  // 1. Keep this as Server Component.
  // 2. Remove `useLanguage` usage for *data fetching*.
  // 3. For *displaying* translated text, pass data to a Client Component OR use a cookie-based language detection if we had it.
  //
  // actually, the simplest way to keep "useLanguage" working for the *UI shell* (like Header/Footer which are client components) 
  // while fetching data is to:
  // Option A: Make this a Server Component that fetches data, then passes it to a Client Component that renders the UI with `useLanguage`.
  // Option B: Keep it "use client" and fetch from API `/api/products?category=...`.
  //
  // User wants "Fix it" quickly.
  // If I keep mock data structure but populate via API...
  //
  // Let's go with OPTION A: Server Component wrapper around Client View.
  // Actually, mixing is hard in one file.
  // Let's make this page "use client" and fetch from API `useEffect`? NO, SEO bad.
  //
  // Let's stay Server Component. 
  // We can't use `useLanguage` hook on server.
  // We will assume 'en' for server fetch, or accept a query param `?lang=bg`.
  //
  // Wait, the previous file WAS `use client`.
  // If I change it to async Server Component, I break `useLanguage`.
  //
  // COMPROMISE:
  // I will make it a Server Component. 
  // I will fetch BOTH EN and BG strings for category description.
  // I will pass these to a new `CategoryClientPage` component that uses `useLanguage` to switch.

  const { products } = await getCategoryData(categorySlug, 'en'); // Fetch EN by default for now, or fetch all?

  // Reuse the hardcoded helpers
  const categoryInfo = categoryHeroData[categorySlug] || categoryHeroData.kites;
  const catNames = categoryNames[categorySlug] || { en: categorySlug, bg: categorySlug };

  return (
    <CategoryClientWrapper
      categorySlug={categorySlug}
      initialProducts={products}
      categoryHero={categoryInfo}
      categoryNames={catNames}
    />
  );
}
