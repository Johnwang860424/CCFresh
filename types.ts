import type { ProductPromo } from "@/app/lib/promotions";

export interface Product {
  id: string;
  name: string;
  weight: string;
  price: number;
  image: string;
  badge: string | null;
  category: string;
  description?: string;
  promo: ProductPromo | null;
}

export interface Category {
  key: string;
  name: string;
}

export interface PickupSpot {
  city: string;
  township: string;
}

export type DeliveryMethod = "pickup" | "delivery";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderFormData {
  name: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  // 指定地點自取
  city: string;
  township: string;
  // 宅配到府
  address: string;
  // 組合後的顯示字串（供收據/訂單顯示）
  location: string;
  remarks: string;
}

/** 送出 /api/orders 的請求內容（價格由後端依商品目錄重算，前端只送 id + 數量）。 */
export interface PlaceOrderRequest {
  customerName: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  city?: string;
  township?: string;
  address?: string;
  note?: string;
  items: { productId: string; quantity: number }[];
}

/** 建單成功後回傳給前端的確認資料。 */
export interface OrderConfirmation {
  id: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  pickupNumber: number;
}
