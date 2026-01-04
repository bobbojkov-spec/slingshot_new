import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";

// Product data
import rpxKite from "@/assets/products/rpx-kite.jpg";
import ghostKite from "@/assets/products/ghost-kite.jpg";
import slingwingV4 from "@/assets/products/slingwing-v4.jpg";
import formulaBoard from "@/assets/products/formula-board.jpg";

const products = [
  {
    id: "rpx-v2",
    name: "RPX V2",
    category: "Kite",
    price: 1899,
    image: rpxKite,
    badge: "New",
    slug: "rpx-v2",
  },
  {
    id: "ghost-v3",
    name: "Ghost V3",
    category: "Kite",
    price: 1799,
    originalPrice: 1999,
    image: ghostKite,
    badge: "Sale",
    slug: "ghost-v3",
  },
  {
    id: "slingwing-v4",
    name: "SlingWing V4",
    category: "Wing",
    price: 899,
    image: slingwingV4,
    badge: "New",
    slug: "slingwing-v4",
  },
  {
    id: "formula-v3",
    name: "Formula V3",
    category: "Board",
    price: 749,
    image: formulaBoard,
    slug: "formula-v3",
  },
];

const BestSellers = () => {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="section-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-section-title block mb-3">Popular</span>
            <h2 className="h2 text-foreground">Best Sellers</h2>
          </div>
          <Link 
            to="/shop" 
            className="hidden sm:inline-flex items-center gap-2 font-heading font-semibold text-primary hover:text-accent transition-colors uppercase tracking-wider text-sm"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile: 2 products, Desktop: 4 products */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.slice(0, 2).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
          {products.slice(2, 4).map((product, index) => (
            <div key={product.id} className="hidden lg:block">
              <ProductCard product={product} index={index + 2} />
            </div>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center sm:hidden">
          <Link 
            to="/shop" 
            className="btn-outline"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
