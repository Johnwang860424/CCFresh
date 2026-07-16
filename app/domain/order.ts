import { calcLineSubtotal } from "@/app/lib/promotions";
import {
  isValidCustomerName,
  isValidTwMobile,
  normalizePhone,
} from "@/app/lib/validation";
import type { DeliveryMethod, PlaceOrderRequest, Product } from "@/types";

export const MAX_QUANTITY = 999;

export interface OrderLine {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  promoType: string | null;
  promoConfig: string | null;
  subtotal: number;
}

export interface PreparedOrder {
  customerName: string;
  phone: string;
  confirmDuplicate: boolean;
  deliveryMethod: DeliveryMethod;
  city: string;
  township: string;
  address: string;
  note: string | null;
  lines: OrderLine[];
  total: number;
}

export type PrepareOrderResult =
  | { value: PreparedOrder }
  | { error: string };

const clean = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

/** 原訂單持有的商品數量（改單時會釋回），product id 與資料庫同為整數。 */
export interface HeldQuantity {
  productId: number;
  quantity: number;
}

/**
 * 改單預檢用的有效目錄：原訂單持有量改單時會釋回，
 * 把 stock 墊高後即可原樣重用 prepareOrder 的庫存預檢與訊息。
 */
export function buildEffectiveCatalog(
  products: Product[],
  held: HeldQuantity[],
): Product[] {
  const heldById = new Map(held.map((h) => [String(h.productId), h.quantity]));
  return products.map((p) =>
    p.stock === null
      ? p
      : { ...p, stock: p.stock + (heldById.get(p.id) ?? 0) },
  );
}

/**
 * 每商品庫存調整差額（新 − 舊）：新增/加量為正＝扣庫存，移除/減量為負＝還庫存；
 * 差額為 0 的商品略過。是否追蹤庫存（stock IS NULL）由 SQL 端過濾。
 */
export function calcStockDeltas(
  before: HeldQuantity[],
  after: HeldQuantity[],
): { productId: number; delta: number }[] {
  const deltaById = new Map<number, number>();
  for (const b of before) {
    deltaById.set(b.productId, (deltaById.get(b.productId) ?? 0) - b.quantity);
  }
  for (const a of after) {
    deltaById.set(a.productId, (deltaById.get(a.productId) ?? 0) + a.quantity);
  }
  return [...deltaById]
    .filter(([, delta]) => delta !== 0)
    .map(([productId, delta]) => ({ productId, delta }));
}

/** Pure order validation and authoritative catalog pricing. */
export function prepareOrder(
  raw: unknown,
  products: Product[],
): PrepareOrderResult {
  if (typeof raw !== "object" || raw === null) return { error: "訂單格式錯誤" };
  const body = raw as Partial<PlaceOrderRequest>;
  const customerName =
    typeof body.customerName === "string" ? body.customerName : "";
  if (!customerName) return { error: "請輸入收貨姓名" };
  if (!isValidCustomerName(customerName)) {
    return { error: "姓名不可包含空白" };
  }

  const phone = clean(body.phone);
  if (!phone) return { error: "請輸入聯絡電話" };
  if (!isValidTwMobile(phone)) return { error: "請輸入有效的台灣手機號碼" };
  if (body.deliveryMethod !== "pickup" && body.deliveryMethod !== "delivery") {
    return { error: "無效的取貨方式" };
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { error: "購物車內沒有商品" };
  }

  const quantityById = new Map<string, number>();
  for (const item of body.items) {
    const id = clean(item?.productId);
    const quantity = Number(item?.quantity);
    if (!id || !Number.isInteger(quantity) || quantity < 1) {
      return { error: "商品數量不正確" };
    }
    const combined = (quantityById.get(id) ?? 0) + quantity;
    if (combined > MAX_QUANTITY) return { error: "商品數量不正確" };
    quantityById.set(id, combined);
  }

  const productById = new Map(products.map((product) => [product.id, product]));

  // 庫存預檢：不限量（stock === null）不檢查；不足則整筆拒絕並列出各品項剩餘量。
  // 目錄可能來自快取，最終防線是資料庫寫入時的原子扣減＋非負約束。
  const shortages: string[] = [];
  for (const [id, quantity] of quantityById) {
    const product = productById.get(id);
    if (product && product.stock !== null && quantity > product.stock) {
      shortages.push(`「${product.name}」庫存不足（剩餘 ${product.stock}）`);
    }
  }
  if (shortages.length > 0) return { error: shortages.join("；") };

  const lines: OrderLine[] = [];
  let total = 0;
  for (const [id, quantity] of quantityById) {
    const product = productById.get(id);
    if (!product) return { error: "部分商品已下架，請重新整理購物車" };
    const subtotal = calcLineSubtotal(product.promo, product.price, quantity);
    total += subtotal;
    lines.push({
      productId: Number(product.id),
      productName: product.name,
      unitPrice: product.price,
      quantity,
      promoType: product.promo?.type ?? null,
      promoConfig: product.promo ? JSON.stringify(product.promo.config) : null,
      subtotal,
    });
  }

  const city = clean(body.city);
  const township = clean(body.township);
  const address = clean(body.address);
  if (body.deliveryMethod === "pickup" && (!city || !township)) {
    return { error: "請選擇取貨地點" };
  }
  if (body.deliveryMethod === "delivery" && !address) {
    return { error: "請輸入收件地址" };
  }

  return {
    value: {
      customerName,
      phone: normalizePhone(phone),
      confirmDuplicate: body.confirmDuplicate === true,
      deliveryMethod: body.deliveryMethod,
      city,
      township,
      address,
      note: clean(body.note) || null,
      lines,
      total,
    },
  };
}
