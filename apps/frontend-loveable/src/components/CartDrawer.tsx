import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, itemCount, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const { language } = useLanguage();

  const t = {
    title: language === 'bg' ? 'Запитване' : 'Inquiry Cart',
    empty: language === 'bg' ? 'Вашата количка е празна' : 'Your inquiry cart is empty',
    browse: language === 'bg' ? 'Разгледай продукти' : 'Browse Products',
    clear: language === 'bg' ? 'Изчисти всички' : 'Clear All',
    sendInquiry: language === 'bg' ? 'Изпрати запитване' : 'Send Inquiry',
    items: language === 'bg' ? 'артикула' : 'items',
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-heading">
            <ShoppingBag className="w-5 h-5" />
            {t.title}
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {t.items})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
            <p className="font-body text-muted-foreground">{t.empty}</p>
            <Link 
              to="/shop" 
              onClick={() => setIsCartOpen(false)}
              className="btn-primary"
            >
              {t.browse}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto py-4 space-y-4">
              {items.map((item, index) => (
                <div 
                  key={`${item.id}-${item.size}-${item.color}-${index}`}
                  className="flex gap-4 p-3 bg-secondary/30 rounded-lg animate-fade-in"
                >
                  <Link 
                    to={`/product/${item.slug}`}
                    onClick={() => setIsCartOpen(false)}
                    className="w-20 h-20 bg-background rounded overflow-hidden shrink-0"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-contain p-2"
                    />
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="font-heading font-semibold text-sm hover:text-accent transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.category} {item.size && `• ${item.size}`}
                    </p>
                    {item.color && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span 
                          className={`w-3 h-3 rounded-full ${
                            item.color === 'blue' ? 'bg-blue-500' : 
                            item.color === 'green' ? 'bg-emerald-500' : 
                            item.color === 'orange' ? 'bg-orange-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground capitalize">{item.color}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color)}
                          className="w-6 h-6 flex items-center justify-center border border-border rounded hover:border-primary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                          className="w-6 h-6 flex items-center justify-center border border-border rounded hover:border-primary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeItem(item.id, item.size, item.color)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <button 
                onClick={clearCart}
                className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                {t.clear}
              </button>
              
              <Link 
                to="/inquiry"
                onClick={() => setIsCartOpen(false)}
                className="btn-primary w-full flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {t.sendInquiry}
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
