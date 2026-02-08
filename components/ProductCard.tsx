import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Product {
  id: string;
  name: string;
  category: string;
  categorySlug?: string;
  price: number;
  originalPrice?: number;
  image: string;
  secondaryImage?: string;
  badge?: string;
  slug: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();
  const { language } = useLanguage();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  // Determine badge style
  const getBadgeClasses = () => {
    if (!product.badge) return "";
    const badgeLower = product.badge.toLowerCase();
    if (badgeLower === "new") {
      return "badge-new";
    }
    if (badgeLower === "best seller" || badgeLower === "bestseller") {
      return "badge-bestseller";
    }
    if (badgeLower === "sale") {
      return "badge-sale";
    }
    return "badge-default";
  };

  const hasSecondaryImage = false; // Disabled by user request: product.secondaryImage && product.secondaryImage !== product.image;

  return (
    <div
      className="product-card group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link href={`/product/${product.slug}`} className="block h-full flex flex-col">
        {/* Image Container */}
        <div className="product-card-image-container aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
          {product.image ? (
            <>
              {/* Primary Image */}
              <div className="absolute inset-0 transition-opacity duration-300">
                <Image
                  src={product.image}
                  alt={`${product.name} - ${product.category}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  priority={index < 4}
                />
              </div>


            </>
          ) : (
            <div className="product-card-image-placeholder">
              <span>{language === "bg" ? "Няма снимка" : "No Image"}</span>
            </div>
          )}

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3 z-10">
              <span className={`product-badge ${getBadgeClasses()}`}>
                {product.badge}
              </span>
            </div>
          )}

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleAdd}
            className="product-card-quick-add"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

        {/* Product Info */}
        <div className="product-card-info flex-1 flex flex-col">
          <span className="product-card-category">
            {product.category}
          </span>
          <h3 className="product-card-title group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <div className="product-card-price mt-auto pt-2">
            <span className="product-card-price-current">
              €{Math.round(parseFloat(product.price.toString())).toLocaleString('de-DE')}
            </span>
            {product.originalPrice && parseFloat(product.originalPrice.toString()) > parseFloat(product.price.toString()) && (
              <span className="product-card-price-original">
                €{Math.round(parseFloat(product.originalPrice.toString())).toLocaleString('de-DE')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
