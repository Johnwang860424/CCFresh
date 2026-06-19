export interface Product {
  id: string;
  name: string;
  weight: string;
  price: number;
  image: string;
  badge?: "熱銷" | "限量" | "新品" | "特惠";
  category: "seafood" | "meat" | "new" | "offers";
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderFormData {
  name: string;
  phone: string;
  location: string;
  remarks: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  phone: string;
  location: string;
  remarks: string;
  createdAt: string;
  status: "pending" | "processing" | "completed";
}
