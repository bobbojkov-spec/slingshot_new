"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { cartStore, type CartItem } from "./cartStore";

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  clear: () => void;
  getCount: () => number;
  updateQuantity: (id: string, size: string | undefined, qty: number, color?: string) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(cartStore.getItems());
  const [isOpen, setIsOpen] = useState(false);

  const refresh = () => setItems(cartStore.getItems());

  const addItem = (item: CartItem) => {
    cartStore.addItem(item);
    refresh();
    setIsOpen(true);
  };

  const removeItem = (id: string, size?: string, color?: string) => {
    cartStore.removeItem(id, size, color);
    refresh();
  };

  const clear = () => {
    cartStore.clear();
    refresh();
    setIsOpen(false);
  };

  const updateQuantity = (id: string, size: string | undefined, qty: number, color?: string) => {
    cartStore.updateQuantity(id, qty, size, color);
    refresh();
  };

  const getCount = () => cartStore.getCount();
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, getCount, updateQuantity, isOpen, open, close }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

