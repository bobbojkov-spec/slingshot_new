import ProductPage from "@/app/product/[slug]/page";

export default async function CollectionProductPage({
    params,
}: {
    params: Promise<{ slug: string; product_slug: string }>;
}) {
    const resolvedParams = await params;
    // 'slug' is the collection slug (from parent [slug])
    // 'product_slug' is the product slug (from current [product_slug])

    // Create a new promise for the ProductPage which expects 'slug' to be the product slug
    const productParams = Promise.resolve({
        slug: resolvedParams.product_slug
    });

    return <ProductPage params={productParams} />;
}
