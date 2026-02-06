"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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
    badge?: string;
}

const PRODUCTS_PER_PAGE = 5;

// Hero Card - Large left panel (40%)
function HeroCard({ product }: { product: Product }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const currentImage = product.images[currentImageIndex];

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

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group block relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 h-full"
        >
            {/* Image */}
            {currentImage ? (
                <img
                    src={currentImage.src}
                    alt={currentImage.alt || product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                    <span className="text-gray-400 font-heading select-none">No Image</span>
                </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />

            {/* Product Name - Top Left, Bold */}
            <div className="absolute top-6 left-6 right-6 z-10">
                <h3
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg leading-tight text-left"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                >
                    {product.name}
                </h3>
            </div>

            {/* Badge */}
            {product.badge && (
                <div className="absolute top-6 right-6 z-10">
                    <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full ${
                        product.badge.toLowerCase() === 'new'
                            ? 'bg-[#e5ff00] text-black'
                            : product.badge.toLowerCase().includes('seller')
                                ? 'bg-[#001f3f] text-white'
                                : 'bg-white/90 text-black'
                    }`}>
                        {product.badge}
                    </span>
                </div>
            )}

            {/* Image navigation (if multiple images) */}
            {product.images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-4 bottom-6 w-10 h-10 backdrop-blur-md bg-white/20 border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 z-10"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute left-16 bottom-6 w-10 h-10 backdrop-blur-md bg-white/20 border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 z-10"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>

                    {/* Image dots */}
                    <div className="absolute bottom-6 right-6 flex gap-1.5 z-10">
                        {product.images.map((_, idx) => (
                            <span
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    idx === currentImageIndex
                                        ? "bg-white"
                                        : "bg-white/40"
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </Link>
    );
}

// Small Card - For the 2x2 grid on the right
function SmallCard({ product }: { product: Product }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const currentImage = product.images[currentImageIndex];

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

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group block relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-500 h-full"
        >
            {/* Image */}
            {currentImage ? (
                <img
                    src={currentImage.src}
                    alt={currentImage.alt || product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                    <span className="text-gray-400 font-heading select-none">No Image</span>
                </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Badge */}
            {product.badge && (
                <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        product.badge.toLowerCase() === 'new'
                            ? 'bg-[#e5ff00] text-black'
                            : product.badge.toLowerCase().includes('seller')
                                ? 'bg-[#001f3f] text-white'
                                : 'bg-white/90 text-black'
                    }`}>
                        {product.badge}
                    </span>
                </div>
            )}

            {/* Product Name - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3
                    className="text-sm md:text-base font-semibold text-white drop-shadow-md leading-tight text-left line-clamp-2"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                >
                    {product.name}
                </h3>
            </div>

            {/* Image navigation (if multiple images) */}
            {product.images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 backdrop-blur-md bg-white/20 border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 z-10"
                    >
                        <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 backdrop-blur-md bg-white/20 border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 z-10"
                    >
                        <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                </>
            )}
        </Link>
    );
}

// Loading skeleton
function BentoSkeleton() {
    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-5">
            {/* Hero skeleton */}
            <div className="w-full md:w-1/2 aspect-square bg-gray-200 rounded-xl animate-pulse" />
            {/* 2x2 grid skeleton */}
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-4 md:gap-5">
                <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}

export default function NewProductsFromCollection() {
    const { t, language } = useLanguage();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch(`/api/collections/featured-products?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    const fetchedProducts = data.products || [];

                    const productsWithImages = await Promise.all(
                        fetchedProducts.map(async (p: any) => {
                            const productRes = await fetch(`/api/products/${p.slug}?lang=${language}`);
                            let allImages: ProductImage[] = [];
                            if (productRes.ok) {
                                const productData = await productRes.json();
                                const prod = productData.product;
                                if (prod?.images && prod.images.length > 0) {
                                    allImages = prod.images.map((imgUrl: string) => ({
                                        src: imgUrl,
                                        alt: prod.name
                                    }));
                                }
                            }

                            if (allImages.length === 0 && p.image) {
                                allImages = [{ src: p.image, alt: p.name }];
                            }

                            return {
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                images: allImages,
                                badge: "New"
                            };
                        })
                    );

                    setAllProducts(productsWithImages);
                }
            } catch (error) {
                console.error("Error fetching new products:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [language]);

    const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);

    const goToPage = (page: number) => {
        if (page < 0 || page >= totalPages) return;
        setCurrentPage(page);
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    // Get current page products
    const startIndex = currentPage * PRODUCTS_PER_PAGE;
    const currentProducts = allProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    const heroProduct = currentProducts[0];
    const gridProducts = currentProducts.slice(1, 5);

    if (loading) {
        return (
            <section className="section-padding bg-background">
                <div className="section-container">
                    <div className="mb-10">
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <BentoSkeleton />
                </div>
            </section>
        );
    }

    if (allProducts.length === 0) {
        return null;
    }

    return (
        <section className="section-padding bg-background">
            <div className="section-container">
                {/* Section Header - Left Aligned */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                    <div className="text-left">
                        <span className="text-section-title block mb-3">{t("newProducts.label")}</span>
                        <h2 className="h2 text-foreground">{t("newProducts.title")}</h2>
                    </div>

                    {/* Ghost View All Button with Arrow Animation */}
                    <Link
                        href="/collections/new-products"
                        className="group inline-flex items-center gap-2 px-6 py-3 border-2 border-foreground/20 rounded-full text-foreground font-semibold hover:border-foreground hover:bg-foreground hover:text-white transition-all duration-300"
                    >
                        <span>{t("newProducts.viewAll") || "View All"}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                </div>

                {/* Bento Box Layout: Hero Left | 2x2 Grid Right - Perfectly Aligned Block */}
                <div ref={scrollContainerRef} className="flex flex-col md:flex-row gap-4 md:gap-5">
                    {/* Hero Card - Square, matches combined height of 2x2 grid */}
                    {heroProduct && (
                        <div className="w-full md:w-1/2 aspect-square md:aspect-auto md:h-auto flex-shrink-0">
                            <div className="h-full w-full" style={{ aspectRatio: '1/1' }}>
                                <HeroCard product={heroProduct} />
                            </div>
                        </div>
                    )}

                    {/* 2x2 Grid - Right Side */}
                    <div className="w-full md:w-1/2 grid grid-cols-2 gap-4 md:gap-5">
                        {gridProducts.map((product) => (
                            <div key={product.id} className="aspect-square">
                                <SmallCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 0}
                            className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center hover:border-foreground hover:bg-foreground hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-foreground/20 disabled:hover:text-foreground"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Page Dots */}
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => goToPage(idx)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        idx === currentPage
                                            ? "bg-foreground scale-110"
                                            : "bg-foreground/20 hover:bg-foreground/40"
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages - 1}
                            className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center hover:border-foreground hover:bg-foreground hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-foreground/20 disabled:hover:text-foreground"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
