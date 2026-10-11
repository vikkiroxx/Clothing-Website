export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Variant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceDelta: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  images: string[];
  category: Category;
  variants: Variant[];
}

export interface CartItem {
  id: string;
  quantity: number;
  variant: Variant & { product: Product };
}

export interface Order {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: string;
    variant: Variant & { product: Product };
  }>;
}
