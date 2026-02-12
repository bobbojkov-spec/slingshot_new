'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import PriceNote from "@/components/PriceNote";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import BackgroundVideoPlayer from "@/components/ui/BackgroundVideoPlayer";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { buildBreadcrumbSchema, businessInfo } from "@/lib/seo/business";
import { buildCanonicalUrlClient } from "@/lib/seo/url";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { Product } from "@/services/products";

interface ProductDetailsClientProps {
    product: Product;
    related: any[];
}

export function ProductDetailsClient({ product, related }: ProductDetailsClientProps) {
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCart();
    const { language, t } = useLanguage();
    const [origin, setOrigin] = useState<string>(process.env.NEXT_PUBLIC_SITE_URL || "");
    const [showStickyBar, setShowStickyBar] = useState(false);
    const addToCartRef = useRef<HTMLDivElement>(null); // renamed from mainButtonRef for clarity

    useEffect(() => {
        if (!origin && typeof window !== "undefined") {
            setOrigin(window.location.origin);
        }
        // Initialize Color Selection
        if (product.colors && product.colors.length > 0 && !selectedColorId) {
            setSelectedColorId(product.colors[0].id);
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Show sticky bar when main button is NOT intersecting (scrolled past)
                // We check boundingClientRect to ensure we are below it, not above
                const isBelow = entry.boundingClientRect.top < 0;
                setShowStickyBar(!entry.isIntersecting && isBelow);
            },
            { threshold: 0 }
        );

        if (addToCartRef.current) {
            observer.observe(addToCartRef.current);
        }

        return () => observer.disconnect();
    }, [product, origin, selectedColorId]);

    // Parse variant title to extract size
    const parseVariantTitle = (title: string) => {
        if (!title) return '';
        if (title.toLowerCase() === 'default title') return 'DEFAULT';
        const match = title.match(/^(\d+(?:\.\d+)?|XXL|XL|L|M|S|XS)\s*(?:[\/\-\s]+)?/i);
        return match ? match[1].toUpperCase() : title;
    };

    // Get color name from variant title
    const getColorFromVariantTitle = (title: string) => {
        if (!title) return '';
        const match = title.match(/(?:[\/\-]\s*|\s{2,})(.+)$/);
        return match ? match[1].trim() : '';
    };

    const getAvailabilityEntry = (variantId?: string | null, colorId?: string | null) => {
        if (!variantId || !product.availability) return null;
        if (!colorId) {
            return product.availability.find((entry) => entry.variant_id === variantId) || null;
        }
        return product.availability.find((entry) => entry.variant_id === variantId && entry.color_id === colorId) || null;
    };

    const getVariantColorId = (variant: NonNullable<Product['variants']>[number]) => {
        if (variant.product_color_id) return variant.product_color_id;
        if (!product.colors) return null;
        const colorName = getColorFromVariantTitle(variant.title || '');
        if (!colorName) return null;
        const match = product.colors.find((color) => color.name?.toLowerCase() === colorName.toLowerCase());
        return match?.id || null;
    };

    // Check if all variants are out of stock (inventory 0 or inactive)
    const isAllVariantsOutOfStock = () => {
        if (!product.variants || product.variants.length === 0) return false;
        if (!product.availability || product.availability.length === 0) return false;
        
        return product.variants.every(variant => {
            // Find availability entries for this variant
            const entries = product.availability?.filter(entry => entry.variant_id === variant.id) || [];
            // If no availability entries, consider it out of stock
            if (entries.length === 0) return true;
            // Check if all entries for this variant are out of stock
            return entries.every(entry => !entry.is_active || entry.stock_qty <= 0);
        });
    };

    const allOutOfStock = isAllVariantsOutOfStock();

    const getUniqueSizeOptions = () => {
        if (!product.variants) return [];
        const sizeGroups = new Map<string, string>();
        product.variants.forEach(v => {
            const sizeKey = parseVariantTitle(v.title);
            if (sizeKey) {
                const cleanLabel = v.title.replace(/\s*[\/\-]\s*.+$/, '').trim();
                const existing = sizeGroups.get(sizeKey);
                if (!existing || cleanLabel.length < existing.length) {
                    sizeGroups.set(sizeKey, cleanLabel);
                }
            }
        });
        return Array.from(sizeGroups.entries()).map(([sizeKey, displayLabel]) => ({
            numericSize: sizeKey,
            displayLabel
        }));
    };

    const getSelectedVariant = () => {
        if (!product.variants || product.variants.length === 0) return null;
        const sizeOptions = getUniqueSizeOptions();
        const effectiveSize = selectedSize || (sizeOptions.length === 1 ? sizeOptions[0].numericSize : '');

        if (!effectiveSize && sizeOptions.length === 0) {
            return product.variants[0];
        }

        if (effectiveSize) {
            const matchingVariants = product.variants.filter(v =>
                parseVariantTitle(v.title) === effectiveSize
            );

            if (matchingVariants.length === 0) return null;
            if (matchingVariants.length === 1) return matchingVariants[0];

            if (selectedColorId) {
                const colorMatch = matchingVariants.find((v) => getVariantColorId(v) === selectedColorId);
                if (colorMatch) return colorMatch;
            }
            return matchingVariants[0];
        }
        return null;
    };

    const handleAddToInquiry = () => {
        if (!product) return;
        const sizeOptions = getUniqueSizeOptions();
        const effectiveSize = selectedSize || (sizeOptions.length === 1 ? sizeOptions[0].numericSize : '');
        const requiresSize = sizeOptions.length > 1;

        if (requiresSize && !effectiveSize) return;

        const variant = getSelectedVariant();
        if (!variant) return;

        const colorId = selectedColorId || getVariantColorId(variant);
        const availabilityEntry = getAvailabilityEntry(variant.id, colorId);
        if (availabilityEntry && (!availabilityEntry.is_active || availabilityEntry.stock_qty <= 0)) return;

        const variantId = variant.id;
        const price = variant.price || product.price;
        const selectedColor = colorId ? product.colors?.find(c => c.id === colorId) : undefined;
        const itemImage = selectedColor?.url || selectedColor?.image_path || product.image;

        addItem({
            id: variantId,
            name: product.name,
            price: price,
            image: itemImage,
            size: effectiveSize || selectedSize,
            color: colorId ? product.colors?.find(c => c.id === colorId)?.name : undefined,
            variantTitle: variant.title || undefined,
            category: product.category,
            slug: product.slug,
            qty: quantity
        });
    };

    const cleanHtml = (html: string | undefined | null) => {
        if (!html) return '';
        return html.replace(/```html\s*/g, '').replace(/```\s*/g, '').trim();
    };

    // Normalize brand for URL
    const brandSlug = product.brand?.toLowerCase() === "ride engine" || product.brand?.toLowerCase() === "rideengine"
        ? "ride-engine"
        : product.brand?.toLowerCase() === "slingshot"
            ? "slingshot"
            : null;

    const categoryIsBrand = product.category_name?.toLowerCase() === "ride engine" ||
        product.category_name?.toLowerCase() === "rideengine" ||
        product.category_name?.toLowerCase() === "slingshot";

    const breadcrumbItems = [
        { label: t("breadcrumbs.home"), href: "/" },
        { label: t("breadcrumbs.shop"), href: "/shop" },
        ...(brandSlug
            ? [{ label: brandSlug === "ride-engine" ? "RIDE ENGINE" : "SLINGSHOT", href: `/shop?brand=${brandSlug}` }]
            : []),
        ...(product.category_name && !categoryIsBrand
            ? [{ label: product.category_name, href: `/shop?brand=${brandSlug}&category=${product.category_slug || product.category_name?.toLowerCase()}` }]
            : []),
        { label: language === "bg" ? (product.name_bg || product.name) : product.name }
    ];

    // Schema generation is handled server-side now for SEO, but we keep breadcrumb visual logic here.
    // Actually, breadcrumb schema can be client side, but product schema MUST be server side for Google.
    // Wait, Google executes JS, but server side is better.
    // The original file generated SchemaJsonLd here. We should ideally move it to server component if possible, or keep it here if it depends on client state.
    // Product Schema depends on static product data, so it can be server side.
    // Breadcrumb schema depends on URL? No, static data.
    // We'll keep SchemaJsonLd here for now to minimize breakage, but eventually move to Server Component.
    // Actually, `buildCanonicalUrlClient` uses `window.location`.
    // We can pass the canonical URL from the server component as a prop to ensuring consistency.

    /* Visual Rendering Logic - Copied verbatim */

    const sizeOptions = getUniqueSizeOptions();
    const effectiveSize = selectedSize || (sizeOptions.length === 1 ? sizeOptions[0].numericSize : '');
    const requiresSize = sizeOptions.length > 1;
    const requiresColor = (product.colors?.length || 0) > 0;

    return (
        <div className="min-h-screen bg-white relative pt-20">
            {/* Breadcrumb Strip */}
            <div className="bg-white border-b border-gray-100 sticky top-20 z-20">
                <div className="section-container">
                    <div className="flex items-center gap-2 md:gap-2 text-[10px] md:text-xs font-medium uppercase tracking-wider text-gray-500 py-2 md:py-4 overflow-x-auto">
                        <Link href="/" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">{t("breadcrumbs.home")}</Link>
                        <span>/</span>
                        <Link href="/shop" className="hover:text-black transition-colors text-black/60 whitespace-nowrap">{t("breadcrumbs.shop")}</Link>

                        {brandSlug && (
                            <>
                                <span>/</span>
                                <Link href={`/shop?brand=${brandSlug}`} className="hover:text-black transition-colors text-black/60 whitespace-nowrap">
                                    {brandSlug === 'ride-engine' ? 'RIDE ENGINE' : 'SLINGSHOT'}
                                </Link>
                            </>
                        )}

                        {product.category_name && !categoryIsBrand && (
                            <>
                                <span>/</span>
                                <Link href={`/shop?brand=${brandSlug}&category=${product.category_slug || product.category_name?.toLowerCase()}`} className="hover:text-black transition-colors text-black/60 whitespace-nowrap">{product.category_name}</Link>
                            </>
                        )}
                        <span className="hidden md:inline">/</span>
                        <span className="text-black font-bold hidden md:inline whitespace-nowrap">{product.name}</span>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            {(product.hero_video_url || product.hero_image_url) && (
                <div className="hero-media relative w-full overflow-hidden mb-8 -mt-8">
                    {product.hero_video_url ? (
                        <BackgroundVideoPlayer
                            videoUrl={product.hero_video_url}
                            poster={product.hero_image_url || product.image}
                        />
                    ) : (
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${product.hero_image_url})` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                </div>
            )}

            <div className="section-container pt-6 md:pt-12 lg:pt-24">
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16">

                    {/* Gallery */}
                    <div className="animate-fade-in min-w-0">
                        <ProductGallery
                            images={product.images}
                            productName={product.name}
                        />
                    </div>

                    {/* Details */}
                    <div className="flex flex-col animate-fade-in" style={{ animationDelay: "100ms" }}>
                        <span className="text-xs md:text-sm font-bold tracking-xxl text-accent mb-2 md:mb-2 uppercase">{product.category_name}</span>
                        <h1 className="font-hero text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-2 md:mb-2">
                            {language === 'bg' ? (product.name_bg || product.title || product.name) : (product.title || product.name)}
                        </h1>

                        {product.subtitle && (
                            <h3 className="h3 font-heading font-bold uppercase tracking-wide mb-2 text-black leading-tight">
                                {language === 'bg' ? (product.subtitle_bg || product.subtitle) : product.subtitle}
                            </h3>
                        )}

                        {product.sku && (
                            <p className="text-[10px] md:text-xs text-black/60 font-mono mb-4 md:mb-6">{`${t("product.sku")}: ${product.sku}`}</p>
                        )}

                        {/* Price Display */}
                        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
                            {(() => {
                                const selectedVariant = getSelectedVariant();

                                if (selectedVariant) {
                                    return (
                                        <>
                                            <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                                €{Math.round(selectedVariant.price).toLocaleString('de-DE')}
                                            </span>
                                            {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                                                <span className="text-lg md:text-xl text-muted-foreground line-through font-medium">
                                                    €{Math.round(selectedVariant.compareAtPrice).toLocaleString('de-DE')}
                                                </span>
                                            )}
                                        </>
                                    );
                                }

                                if (product.variants && product.variants.length > 0) {
                                    const prices = product.variants.map(v => v.price).filter(p => !isNaN(p));
                                    if (prices.length > 0) {
                                        const min = Math.min(...prices);
                                        const max = Math.max(...prices);
                                        const displayPrice = min === max ? `€${Math.round(min).toLocaleString('de-DE')}` : `€${Math.round(min).toLocaleString('de-DE')} - €${Math.round(max).toLocaleString('de-DE')}`;
                                        return <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{displayPrice}</span>;
                                    }
                                }

                                return <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">€{Math.round(product.price || 0).toLocaleString('de-DE')}</span>;
                            })()}
                        </div>

                        {(language === 'bg' ? (product.description_html_bg || product.description_html) : product.description_html) && (
                            <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.description_html_bg || product.description_html) : product.description_html) }}
                            />
                        )}

                        <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.description_bg || product.description) : product.description) }} />

                        {/* Key Features */}
                        {product.features && product.features.length > 0 && (
                            <div className="mb-8">
                                <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{t("product.keyFeatures")}</h4>
                                <ul className="space-y-2">
                                    {product.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-black mt-2.5 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mb-8">
                            <PriceNote />
                        </div>

                        {/* Visual Color Selector */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="mb-6 md:mb-8">
                                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-4 block">
                                    {t("product.color")}: {selectedColorId && (
                                        <span className="font-normal text-gray-600">
                                            {product.colors.find(c => c.id === selectedColorId)?.name}
                                        </span>
                                    )}
                                </span>
                                <div className="flex gap-2 md:gap-4 flex-wrap">
                                    {product.colors.map((color) => {
                                        let isAvailable = true;
                                        if (selectedSize && product.variants) {
                                            const matchingVariants = product.variants.filter(v =>
                                                parseVariantTitle(v.title) === selectedSize
                                            );
                                            isAvailable = matchingVariants.some((v) => {
                                                const variantColorId = getVariantColorId(v);
                                                if (variantColorId !== color.id) return false;
                                                const availabilityEntry = getAvailabilityEntry(v.id, color.id);
                                                return availabilityEntry ? availabilityEntry.is_active && availabilityEntry.stock_qty > 0 : true;
                                            });
                                        }

                                        return (
                                            <button
                                                key={color.id}
                                                onClick={() => isAvailable && setSelectedColorId(color.id)}
                                                disabled={!isAvailable}
                                                title={`${color.name}${!isAvailable ? ' (' + (language === 'bg' ? 'изчерпано' : 'out of stock') + ')' : ''}`}
                                                className={`w-14 h-14 md:w-12 md:h-12 rounded border-2 overflow-hidden relative transition-all ${selectedColorId === color.id
                                                    ? 'border-black ring-1 ring-black ring-offset-2'
                                                    : isAvailable
                                                        ? 'border-transparent hover:border-gray-300 hover:scale-105'
                                                        : 'border-gray-200 opacity-40 cursor-not-allowed'
                                                    }`}
                                            >
                                                <img
                                                    src={color.url || color.image_path}
                                                    alt={color.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                {!isAvailable && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                                        <span className="text-xs text-gray-500">✕</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sizes/Variants */}
                        {(product.variants && product.variants.length > 0) && (
                            <div className={`mb-6 md:mb-8 ${sizeOptions.length === 1 && (sizeOptions[0].numericSize === 'DEFAULT' || sizeOptions[0].displayLabel.toLowerCase() === 'default title') ? 'hidden' : ''}`}>
                                <span className="font-bold text-xs uppercase tracking-wide text-gray-900 mb-4 block">{t("size")}</span>
                                <div className="flex gap-2 flex-wrap">
                                    {(() => {
                                        if (sizeOptions.length === 0) {
                                            return <span className="text-sm text-gray-500 italic">{t("product.noSizesAvailable")}</span>;
                                        }

                                        return sizeOptions.map(({ numericSize, displayLabel }, idx) => {
                                            const sizeVariants = product.variants?.filter(v =>
                                                parseVariantTitle(v.title) === numericSize
                                            ) || [];

                                            // Check if this specific size is available
                                            let isAvailable = sizeVariants.length > 0;
                                            
                                            if (allOutOfStock) {
                                                isAvailable = false;
                                            } else {
                                                // Check availability for this size
                                                if (selectedColorId) {
                                                    // With color selected: check if any variant of this size has the selected color in stock
                                                    isAvailable = sizeVariants.some((v) => {
                                                        const variantColorId = getVariantColorId(v);
                                                        if (variantColorId !== selectedColorId) return false;
                                                        const availabilityEntry = getAvailabilityEntry(v.id, selectedColorId);
                                                        return availabilityEntry ? availabilityEntry.is_active && availabilityEntry.stock_qty > 0 : true;
                                                    });
                                                } else {
                                                    // No color selected: check if any variant of this size is in stock
                                                    isAvailable = sizeVariants.some((v) => {
                                                        const availabilityEntry = getAvailabilityEntry(v.id, null);
                                                        return availabilityEntry ? availabilityEntry.is_active && availabilityEntry.stock_qty > 0 : true;
                                                    });
                                                }
                                            }
                                            
                                            const isSelected = !allOutOfStock && selectedSize === numericSize && isAvailable;

                                            return (
                                                <button
                                                    key={`${numericSize}-${idx}`}
                                                    onClick={() => isAvailable && setSelectedSize(numericSize)}
                                                    disabled={!isAvailable}
                                                    title={!isAvailable ? (language === 'bg' ? 'Изчерпано' : 'Out of stock') : displayLabel}
                                                    className={`px-4 md:px-4 py-2 md:py-2 rounded border text-sm font-medium transition-all min-w-[60px] md:min-w-0 ${isSelected
                                                        ? "border-black bg-black text-white"
                                                        : isAvailable
                                                            ? "border-gray-200 hover:border-black text-gray-700"
                                                            : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                                        }`}
                                                >
                                                    {displayLabel}
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Add to Cart */}
                        <div className="flex flex-col sm:flex-row gap-4 md:gap-4 mt-auto pt-6 md:pt-8 border-t border-gray-100">
                            <div className={`flex items-center border rounded overflow-hidden w-full sm:w-fit justify-center ${allOutOfStock ? 'border-gray-200 bg-gray-50' : 'border-gray-300'}`}>
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    aria-label={t("quantity.decrease")}
                                    disabled={allOutOfStock}
                                    className={`px-6 md:px-4 py-4 transition-colors ${allOutOfStock ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200'}`}
                                >
                                    <Minus className="w-5 h-5 md:w-4 md:h-4" />
                                </button>
                                <span className={`font-medium w-16 md:w-12 text-center text-lg md:text-base ${allOutOfStock ? 'text-gray-400' : ''}`}>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    aria-label={t("quantity.increase")}
                                    disabled={allOutOfStock}
                                    className={`px-6 md:px-4 py-4 transition-colors ${allOutOfStock ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200'}`}
                                >
                                    <Plus className="w-5 h-5 md:w-4 md:h-4" />
                                </button>
                            </div>
                            <div ref={addToCartRef}>
                                <button
                                    onClick={handleAddToInquiry}
                                    disabled={allOutOfStock || (requiresSize && !effectiveSize) || (requiresColor && !selectedColorId)}
                                    className={`w-full font-bold uppercase tracking-widest py-4 md:py-4 px-8 transition-colors flex items-center justify-center gap-2 rounded text-sm md:text-base ${allOutOfStock || (requiresSize && !effectiveSize) || (requiresColor && !selectedColorId)
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-black text-white hover:bg-gray-900 active:bg-gray-800'
                                        }`}
                                >
                                    <ShoppingBag className="w-5 h-5" /> {t("product.addToInquiry")}
                                </button>
                            </div>
                        </div>
                        
                        {/* Out of Stock Message */}
                        {allOutOfStock && (
                            <div className="product-unavailable mt-4 text-center">
                                <span className="product-unavailable-message text-red-600 font-semibold text-sm">
                                    {t("product.notAvailable")}
                                </span>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Extended Description (Html2) */}
            {(language === 'bg' ? (product.description_html2_bg || product.description_html2) : product.description_html2) && (
                <div className="section-container py-8 border-t border-gray-100 mb-8">
                    <div className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.description_html2_bg || product.description_html2) : product.description_html2) }}
                    />
                </div>
            )}

            {/* Specs HTML */}
            {(language === 'bg' ? (product.specs_html_bg || product.specs_html) : product.specs_html) && (
                <div className="section-container py-16 border-t border-gray-100">
                    <h3 className="h2 font-bold uppercase tracking-tight mb-8">
                        {t("specs")}
                    </h3>
                    <div className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.specs_html_bg || product.specs_html) : product.specs_html) }}
                    />
                </div>
            )}

            {/* Package Includes */}
            {(language === 'bg' ? (product.package_includes_bg || product.package_includes) : product.package_includes) && (
                <div className="section-container py-16 border-t border-gray-100">
                    <div className="">
                        <h3 className="h2 font-bold uppercase tracking-tight mb-8">
                            {language === 'bg' ? 'Пакетът включва' : 'Package Includes'}
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-800"
                            dangerouslySetInnerHTML={{ __html: cleanHtml(language === 'bg' ? (product.package_includes_bg || product.package_includes) : product.package_includes) }}
                        />
                    </div>
                </div>
            )}

            {/* Mobile Sticky Bottom Bar */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-transform duration-300 md:hidden ${showStickyBar ? 'translate-y-0' : 'translate-y-full'
                    }`}
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', paddingTop: '16px', paddingLeft: '16px', paddingRight: '16px' }}
            >
                <div className="flex gap-3">
                    <div className={`flex items-center border rounded overflow-hidden w-24 shrink-0 justify-center ${allOutOfStock ? 'border-gray-200 bg-gray-50' : 'border-gray-300'}`}>
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            aria-label={t("quantity.decrease")}
                            disabled={allOutOfStock}
                            className={`px-3 py-3 transition-colors ${allOutOfStock ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200'}`}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className={`font-medium text-sm w-6 text-center ${allOutOfStock ? 'text-gray-400' : ''}`}>{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            aria-label={t("quantity.increase")}
                            disabled={allOutOfStock}
                            className={`px-3 py-3 transition-colors ${allOutOfStock ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200'}`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={handleAddToInquiry}
                        disabled={allOutOfStock || (requiresSize && !effectiveSize) || (requiresColor && !selectedColorId)}
                        className={`flex-1 font-bold uppercase tracking-widest py-3 px-4 transition-colors flex items-center justify-center gap-2 rounded text-sm ${allOutOfStock || (requiresSize && !effectiveSize) || (requiresColor && !selectedColorId)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-900 active:bg-gray-800'
                            }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {language === 'bg' ? 'Купи' : 'Add'}
                    </button>
                </div>
                
                {/* Out of Stock Message for Mobile */}
                {allOutOfStock && (
                    <div className="product-unavailable mt-3 text-center">
                        <span className="product-unavailable-message text-red-600 font-semibold text-sm">
                            {t("product.notAvailable")}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
