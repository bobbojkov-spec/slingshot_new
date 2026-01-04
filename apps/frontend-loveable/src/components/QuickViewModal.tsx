import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ShoppingBag, Minus, Plus, ExternalLink } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  slug: string;
  sizes?: string[];
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal = ({ product, isOpen, onClose }: QuickViewModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const { addItem, setIsCartOpen } = useCart();
  const { t, language } = useLanguage();

  if (!product) return null;

  const sizes = product.sizes || ["7m", "9m", "10m", "12m"];

  const handleAddToInquiry = () => {
    addItem({
      id: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      size: selectedSize || sizes[0],
      slug: product.slug,
    }, quantity);
    setIsCartOpen(true);
    onClose();
    setQuantity(1);
    setSelectedSize(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <div className="grid sm:grid-cols-2 gap-0">
          {/* Image */}
          <div className="bg-secondary/30 p-6 flex items-center justify-center">
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-[300px] object-contain"
            />
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="text-left mb-4">
              <span className="text-sm font-heading uppercase tracking-wider text-accent">
                {product.category}
              </span>
              <DialogTitle className="font-heading text-2xl font-bold">
                {product.name}
              </DialogTitle>
            </DialogHeader>

            {/* Badge */}
            {product.badge && (
              <span className={`inline-block w-fit px-2 py-1 text-xs font-heading font-semibold uppercase tracking-wide rounded mb-4 ${
                product.badge === "New" ? "bg-wind-green text-deep-navy" : "bg-accent text-white"
              }`}>
                {product.badge}
              </span>
            )}

            {/* Size Selector */}
            <div className="mb-4">
              <span className="font-heading font-semibold text-sm uppercase tracking-wide text-foreground mb-2 block">
                {language === 'bg' ? 'Размер' : 'Size'}
              </span>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size) => (
                  <button 
                    key={size} 
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 rounded border font-body text-sm transition-all ${
                      (selectedSize || sizes[0]) === size 
                        ? "border-accent bg-accent text-white" 
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <span className="font-heading font-semibold text-sm uppercase tracking-wide text-foreground mb-2 block">
                {language === 'bg' ? 'Количество' : 'Quantity'}
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="w-8 h-8 flex items-center justify-center border border-border rounded hover:border-primary"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-body text-lg w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)} 
                  className="w-8 h-8 flex items-center justify-center border border-border rounded hover:border-primary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button onClick={handleAddToInquiry} className="btn-primary w-full">
                <ShoppingBag className="w-5 h-5 mr-2" />
                {language === 'bg' ? 'Добави за запитване' : 'Add to Inquiry'}
              </button>
              
              <Link 
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="btn-outline w-full flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {language === 'bg' ? 'Виж детайли' : 'View Details'}
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
