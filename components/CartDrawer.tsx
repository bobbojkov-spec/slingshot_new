"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, clear, isOpen, close, getCount } = useCart();
  const { t } = useLanguage();

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />
      <div className={`absolute top-0 right-0 h-[70vh] w-full sm:w-96 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-heading">
            <ShoppingBag className="w-5 h-5" />
              <span>{t("cart.title")}</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({getCount()} {t("cart.itemsLabel")})
              </span>
          </div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 px-6 text-muted-foreground">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
            <p className="font-body text-muted-foreground">{t("cart.empty")}</p>
            <Link
              href="/shop"
              onClick={close}
              className="btn-primary inline-flex items-center gap-2"
            >
              {t("cart.browse")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${item.size}-${item.color}-${index}`} className="flex gap-3 p-3 bg-secondary/30 rounded-lg">
                  <Link href={`/product/${item.slug}`} className="w-20 h-20 bg-background rounded overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.slug}`} className="text-sm font-heading font-semibold text-foreground block hover:text-accent">
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.category} {item.size ? `• ${item.size}` : ""}
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
                          onClick={() => updateQuantity(item.id, item.size, item.qty - 1, item.color)}
                          className="w-6 h-6 flex items-center justify-center border border-border rounded hover:border-primary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-foreground">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.qty + 1, item.color)}
                          className="w-6 h-6 flex items-center justify-center border border-border rounded hover:border-primary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id, item.size, item.color)} className="text-muted-foreground hover:text-destructive text-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pt-4 pb-6 border-t border-border space-y-3">
              <button onClick={clear} className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors text-left px-0">
                {t("cart.clear")}
              </button>
              <Link
                href="/inquiry/summary"
                onClick={close}
                className="btn-primary w-full flex items-center justify-center gap-2 px-6 py-3"
              >
                <MessageCircle className="w-4 h-4" />
                {t("cart.sendInquiry")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;

