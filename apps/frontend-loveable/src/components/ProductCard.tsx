import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye } from "lucide-react";
import QuickViewModal from "@/components/QuickViewModal";

interface Product {
  id: string;
  name: string;
  category: string;
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
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  return (
    <>
      <div 
        className="product-card group animate-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Image Container */}
        <div className="relative">
          <Link to={`/product/${product.slug}`}>
            <img 
              src={product.image} 
              alt={product.name}
              className="product-card-image transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          
          {/* Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3">
              <span className={`product-badge ${product.badge === "New" ? "badge-new" : "badge-sale"}`}>
                {product.badge}
              </span>
            </div>
          )}

          {/* Quick View Button - appears on hover */}
          <button
            onClick={() => setIsQuickViewOpen(true)}
            className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full 
                       flex items-center justify-center shadow-md
                       opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                       transition-all duration-300 hover:bg-accent hover:text-white"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <Link to={`/product/${product.slug}`} className="block p-4">
          <span className="font-body text-sm text-muted-foreground uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-heading font-semibold text-foreground mt-1 mb-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="price-display">
              €{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="price-original">
                €{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </Link>
      </div>

      <QuickViewModal 
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
};

export default ProductCard;
