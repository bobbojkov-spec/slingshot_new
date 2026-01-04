export interface CartItem {
  id: string;
  name: string;
  price?: number;
  image?: string;
  qty: number;
  size?: string;
  color?: string;
  category?: string;
  slug?: string;
}

const items: CartItem[] = [];

export const cartStore = {
  addItem(item: CartItem) {
    const idx = items.findIndex(
      (i) => i.id === item.id && i.size === item.size && i.color === item.color
    );

    if (idx > -1) {
      items[idx].qty += item.qty;
    } else {
      items.push({ ...item });
    }
  },

  removeItem(id: string, size?: string, color?: string) {
    const index = items.findIndex((item) => item.id === id && item.size === size && item.color === color);
    if (index > -1) {
      items.splice(index, 1);
    }
  },

  updateQuantity(id: string, qty: number, size?: string, color?: string) {
    if (qty < 1) {
      this.removeItem(id, size, color);
      return;
    }

    const index = items.findIndex((item) => item.id === id && item.size === size && item.color === color);
    if (index > -1) {
      items[index].qty = qty;
    }
  },

  clear() {
    items.splice(0, items.length);
  },

  getItems() {
    return [...items];
  },

  getCount() {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }
};

