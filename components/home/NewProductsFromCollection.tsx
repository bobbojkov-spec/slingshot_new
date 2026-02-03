"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductImage {
    src: string;
    alt: string;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    images: ProductImage[];
}

// Shuffle and limit array
function shuffleAndLimit<T>(array: T[], limit: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, limit);
}

// Individual product card with image carousel
function ProductCarouselCard({ product }: { product: Product }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { language } = useLanguage();

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) =>
            prev >= product.images.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) =>
            prev <= 0 ? product.images.length - 1 : prev - 1
        );
    };

    const currentImage = product.images[currentImageIndex];

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group block relative aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-md hover:shadow-xl transition-all duration-500"
        >
            {/* Image */}
            {currentImage ? (
                <img
                    src={currentImage.src}
                    alt={currentImage.alt || product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-deep-navy/10">
                    <span className="text-gray-400 font-heading select-none">No Image</span>
                </div>
            )}

            {/* Dark gradient stripe at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-deep-navy via-deep-navy/70 to-transparent" />

            {/* Product name over the stripe */}
            <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6">
                <h3 className="font-heading font-semibold text-white text-lg lg:text-xl group-hover:text-accent transition-colors line-clamp-2">
                    {product.name}
                </h3>
            </div>

            {/* Image navigation arrows (only if multiple images) */}
            {product.images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white z-10"
                    >
                        <ChevronLeft className="w-5 h-5 text-deep-navy" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white z-10"
                    >
                        <ChevronRight className="w-5 h-5 text-deep-navy" />
                    </button>

                    {/* Image dots indicator */}
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {product.images.map((_, idx) => (
                            <span
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? "bg-white" : "bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </Link>
    );
}

export default function NewProductsFromCollection() {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                // Fetch from featured-products collection
                const res = await fetch(`/api/collections/featured-products?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    // Get random 4 products from the collection
                    const randomProducts = shuffleAndLimit(data.products || [], 4);

                    // Fetch full product details including all images for each product
                    const productsWithImages = await Promise.all(
                        randomProducts.map(async (p: any) => {
                            // Fetch product details to get all images
                            const productRes = await fetch(`/api/products/${p.slug}?lang=${language}`);
                            let allImages: ProductImage[] = [];
                            if (productRes.ok) {
                                const productData = await productRes.json();
                                const prod = productData.product;
                                if (prod?.images && prod.images.length > 0) {
                                    // Map signed URLs to ProductImage objects
                                    allImages = prod.images.map((imgUrl: string) => ({
                                        src: imgUrl,
                                        alt: prod.name
                                    }));
                                }
                            }

                            // Fallback to single image if detail fetch fails
                            if (allImages.length === 0 && p.image) {
                                allImages = [{ src: p.image, alt: p.name }];
                            }

                            return {
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                images: allImages
                            };
                        })
                    );

                    setProducts(productsWithImages);
                }
            } catch (error) {
                console.error("Error fetching new products:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [language]);

    if (loading) {
        return (
            <section className="section-padding bg-background">
                <div className="section-container">
                    <div className="text-center mb-10">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
                        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="section-padding bg-background">
            <div className="section-container">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <span className="text-section-title block mb-3">{t("newProducts.label")}</span>
                    <h2 className="h2 text-foreground">{t("newProducts.title")}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCarouselCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
