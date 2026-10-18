export type Audience = "MEN" | "WOMEN" | "KIDS";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
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
  audience: Audience;
  category: Category;
  variants: Variant[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  variant: Variant & { product: Product };
}

export interface Address {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  addresses?: Address[];
}

export interface ShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface Order {
  id: string;
  status: string;
  totalAmount: string;
  shippingAddress: ShippingAddress;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: string;
    variant: Variant & { product: Product };
  }>;
}
