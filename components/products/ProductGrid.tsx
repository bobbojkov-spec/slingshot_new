import ProductCard from "@/components/ProductCard";

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    secondaryImage?: string;
    badge?: string;
    slug: string;
}

interface ProductGridProps {
    products: Product[];
    columns?: number;
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
    const gridClass = columns === 3
        ? "grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12"
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12";

    return (
        <div className={gridClass}>
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
            ))}
        </div>
    );
}
