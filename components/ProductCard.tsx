"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";

interface Product {
  id: string;
  name: string;
  category: string;
  categorySlug?: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  slug: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
      category: product.category,
      qty: 1
    });
  };
  return (
    <div className="product-card group animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="relative">
        <Link href={`/product/${product.slug}`}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-card-image transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="product-card-image bg-gray-100 flex items-center justify-center text-gray-400 aspect-[4/5] object-cover w-full h-full transition-transform duration-300 group-hover:scale-105">
              No Image
            </div>
          )}
        </Link>
        {product.badge && (
          <div className="absolute top-3 left-3">
            <span className={`product-badge ${product.badge === "New" ? "badge-new" : "badge-sale"}`}>
              {product.badge}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            handleAdd();
          }}
          className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-accent hover:text-white"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
      <Link href={`/product/${product.slug}`} className="block p-4">
        <span className="font-body text-sm text-muted-foreground uppercase tracking-wide">{product.category}</span>
        <h3 className="font-heading font-semibold text-foreground mt-1 mb-2 group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="price-display">€{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="price-original">€{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;

