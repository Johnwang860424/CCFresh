import type { ProductPromo } from "@/app/lib/promotions";

export interface Product {
  id: string;
  name: string;
  weight: string;
  price: number;
  images: string[];
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
  total: number;
  deliveryMethod: DeliveryMethod;
  /** 顯示用取貨號：自取＝站點代碼＋流水號（如 A3）；宅配＝純數字。 */
  pickupCode: string;
}

/** 電話查詢訂單：單筆品項（寫入當下的快照，非最新目錄）。 */
export interface LookupOrderItem {
  name: string;
  quantity: number;
  subtotal: number;
}

/** 電話查詢訂單：回傳給前端的單筆訂單。 */
export interface LookupOrder {
  id: string;
  /** 顯示用取貨號：自取＝站點代碼＋流水號（如 A3）；宅配＝純數字。 */
  pickupCode: string;
  customerName: string;
  deliveryMethod: DeliveryMethod;
  /** 自取＝縣市＋取貨點；宅配＝收件地址。 */
  location: string;
  items: LookupOrderItem[];
  total: number;
  note: string | null;
  createdAt: string;
}
