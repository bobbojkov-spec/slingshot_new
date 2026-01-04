// TypeScript types matching your database structure
export interface Product {
  id: string;
  handle: string;
  brand: string;
  title: string;
  description: string | null;
  category: string | null;
  discipline: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt?: string;
  sort_order?: number;
}

