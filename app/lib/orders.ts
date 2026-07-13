import { sql } from "@/app/lib/db";
import { getProducts } from "@/app/lib/products";
import { prepareOrder, type OrderLine } from "@/app/domain/order";
import { revalidateCache } from "@/app/lib/revalidate";
import { normalizePhone } from "@/app/lib/validation";
import { normalizeCustomerIdentity } from "@/app/domain/duplicate-order";
import type {
  DuplicateOrderResponse,
  LookupOrder,
  OrderConfirmation,
} from "@/types";
import {
  DUPLICATE_ORDER_CODE,
  DUPLICATE_ORDER_MESSAGE,
} from "@/types";

// pickup_number 撞唯一鍵（併發下單同一取貨點）時的重試次數。
const PICKUP_NUMBER_RETRIES = 5;

// 顯示用取貨號：自取＝站點代碼（pickup_spots.code，管理端維護）＋流水號；宅配無站點＝純數字。
function formatPickupCode(
  spotCode: string | null,
  pickupNumber: number,
): string {
  return spotCode === null ? String(pickupNumber) : `${spotCode}${pickupNumber}`;
}

// Postgres 唯一鍵衝突。
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

// 庫存非負約束違反（SQLSTATE 23514 + 具名 CHECK products_stock_nonneg）：
// 預檢通過但寫入時庫存被併發搶走，或快取目錄較資料庫舊。
function isStockCheckViolation(err: unknown): boolean {
  const e = err as { code?: string; constraint?: string };
  return e?.code === "23514" && e?.constraint === "products_stock_nonneg";
}

// 23514 後援：重查目前庫存，組與預檢同款的「庫存不足」訊息；
// 若重查已無不足（庫存又變動），給通用訊息請使用者重試。
async function buildStockInsufficientError(
  lines: OrderLine[],
): Promise<string> {
  const ids = lines.map((li) => li.productId);
  const rows = (await sql`
    SELECT id, name, stock FROM products WHERE id = ANY(${ids})
  `) as { id: number; name: string; stock: number | null }[];
  const wantedById = new Map(lines.map((li) => [li.productId, li.quantity]));
  const parts = rows
    .filter(
      (r) => r.stock !== null && (wantedById.get(r.id) ?? 0) > r.stock,
    )
    .map((r) => `「${r.name}」庫存不足（剩餘 ${r.stock}）`);
  return parts.length > 0
    ? parts.join("；")
    : "部分商品庫存不足，請重新整理後再試";
}

/**
 * 驗證請求、依後端商品目錄重算價格、寫入訂單與明細。
 * 回傳 { order } 或 { error }（由呼叫端決定回應 400/500）。
 * 重點：完全不信任前端送來的價格，價格/促銷一律以資料庫為準。
 */
export async function createOrder(
  raw: unknown,
): Promise<
  | { order: OrderConfirmation }
  | DuplicateOrderResponse
  | { error: string }
> {
  const products = await getProducts();
  const prepared = prepareOrder(raw, products);
  if ("error" in prepared) return prepared;
  const value = prepared.value;

  if (
    !value.confirmDuplicate &&
    await hasDuplicateOrder(value.customerName, value.phone)
  ) {
    return {
      code: DUPLICATE_ORDER_CODE,
      error: DUPLICATE_ORDER_MESSAGE,
    };
  }

  // 取貨方式相關欄位。
  let pickupSpotId: number | null = null;
  let spotCode: string | null = null;
  let shippingAddress: string | null = null;
  if (value.deliveryMethod === "pickup") {
    const spots = (await sql`
      SELECT id, code FROM pickup_spots
      WHERE city = ${value.city} AND township = ${value.township}
      LIMIT 1
    `) as { id: number; code: string }[];
    if (spots.length === 0) {
      return { error: "取貨地點不存在" };
    }
    pickupSpotId = spots[0].id;
    spotCode = spots[0].code;
  } else {
    shippingAddress = value.address;
  }

  // 建單：訂單、明細、扣庫存以單一 CTE 語句原子寫入（Neon HTTP 無互動式交易）。
  // 取貨單需在同一取貨點內遞增號碼牌，撞唯一鍵時重試。
  const result = await insertOrder({
    customerName: value.customerName,
    phone: value.phone,
    deliveryMethod: value.deliveryMethod,
    pickupSpotId,
    shippingAddress,
    note: value.note,
    total: value.total,
    lines: value.lines,
  });
  if ("error" in result) return result;

  // 庫存已隨建單扣減：革除本地商品快取並回敲後台，兩邊售完/剩餘量即時反映。
  await revalidateCache("products");

  return {
    order: {
      total: value.total,
      deliveryMethod: value.deliveryMethod,
      pickupCode: formatPickupCode(spotCode, result.pickupNumber),
    },
  };
}

/** 只有去除首尾空白的姓名與正規化電話皆相同才視為疑似重複。 */
async function hasDuplicateOrder(
  customerName: string,
  phone: string,
): Promise<boolean> {
  const identity = normalizeCustomerIdentity({ customerName, phone });
  const rows = (await sql`
    SELECT EXISTS (
      SELECT 1
      FROM orders
      WHERE customer_name = ${identity.customerName}
        AND phone = ${identity.phone}
    ) AS exists
  `) as { exists: boolean }[];
  return rows[0]?.exists === true;
}

interface InsertOrderArgs {
  customerName: string;
  phone: string;
  deliveryMethod: "pickup" | "delivery";
  pickupSpotId: number | null;
  shippingAddress: string | null;
  note: string | null;
  total: number;
  lines: OrderLine[];
}

async function insertOrder(
  args: InsertOrderArgs,
): Promise<{ id: number; pickupNumber: number } | { error: string }> {
  // unnest 用的平行陣列（promo_config 以 text[] 傳入，於 SELECT 時逐筆轉 jsonb）。
  // prepareOrder 已合併重複商品，一商品恰一列，扣庫存的 UPDATE 不會重複命中同列。
  const productIdArr = args.lines.map((li) => li.productId);
  const productNameArr = args.lines.map((li) => li.productName);
  const unitPriceArr = args.lines.map((li) => li.unitPrice);
  const quantityArr = args.lines.map((li) => li.quantity);
  const promoTypeArr = args.lines.map((li) => li.promoType);
  const promoConfigArr = args.lines.map((li) => li.promoConfig);
  const subtotalArr = args.lines.map((li) => li.subtotal);

  for (let attempt = 0; attempt < PICKUP_NUMBER_RETRIES; attempt++) {
    try {
      const rows = (await sql`
        WITH new_order AS (
          INSERT INTO orders
            (customer_name, phone, delivery_method, pickup_spot_id, shipping_address,
             pickup_number, note, total)
          VALUES
            (${args.customerName}, ${args.phone}, ${args.deliveryMethod}, ${args.pickupSpotId}, ${args.shippingAddress},
             (SELECT COALESCE(MAX(pickup_number), 0) + 1
                FROM orders WHERE pickup_spot_id IS NOT DISTINCT FROM ${args.pickupSpotId}),
             ${args.note}, ${args.total})
          RETURNING id, pickup_number
        ),
        dec AS (
          -- 與訂單/明細同句原子扣減庫存。不限量（stock IS NULL）不扣；
          -- 扣到負值違反 products_stock_nonneg CHECK，整句失敗＝零部分效果；
          -- 併發由 UPDATE 行鎖序列化，永不超賣。
          UPDATE products p
          SET stock = p.stock - t.qty
          FROM unnest(
            ${productIdArr}::int[],
            ${quantityArr}::int[]
          ) AS t(product_id, qty)
          WHERE p.id = t.product_id AND p.stock IS NOT NULL
        ),
        items AS (
          INSERT INTO order_items
            (order_id, product_id, product_name, unit_price, quantity,
             promo_type, promo_config, subtotal)
          SELECT new_order.id, t.product_id, t.product_name, t.unit_price, t.quantity,
                 t.promo_type, t.promo_config::jsonb, t.subtotal
          FROM new_order, unnest(
            ${productIdArr}::int[],
            ${productNameArr}::text[],
            ${unitPriceArr}::int[],
            ${quantityArr}::int[],
            ${promoTypeArr}::text[],
            ${promoConfigArr}::text[],
            ${subtotalArr}::int[]
          ) AS t(product_id, product_name, unit_price, quantity,
                 promo_type, promo_config, subtotal)
        )
        SELECT id, pickup_number FROM new_order
      `) as { id: number; pickup_number: number }[];
      return { id: rows[0].id, pickupNumber: rows[0].pickup_number };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < PICKUP_NUMBER_RETRIES - 1) {
        continue;
      }
      // 庫存不足：重查剩餘量組友善訊息，不重試（重試也不會變夠）。
      if (isStockCheckViolation(err)) {
        return { error: await buildStockInsufficientError(args.lines) };
      }
      throw err;
    }
  }
  // 不會到這（迴圈內非 return 即 throw），滿足型別檢查。
  throw new Error("無法配發訂單號碼，請重試");
}

interface LookupRow {
  id: number;
  pickup_number: number;
  spot_code: string | null;
  customer_name: string;
  delivery_method: "pickup" | "delivery";
  shipping_address: string | null;
  note: string | null;
  total: number;
  created_at: string | Date;
  city: string | null;
  township: string | null;
  items: { name: string; quantity: number; subtotal: number }[];
}

function toLookupOrder(row: LookupRow): LookupOrder {
  return {
    id: String(row.id),
    pickupCode: formatPickupCode(row.spot_code, row.pickup_number),
    customerName: row.customer_name,
    deliveryMethod: row.delivery_method,
    location:
      row.delivery_method === "pickup"
        ? `${row.city ?? ""}${row.township ?? ""}`
        : (row.shipping_address ?? ""),
    items: row.items.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      subtotal: Number(item.subtotal),
    })),
    total: Number(row.total),
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * 依電話查詢該電話的全部訂單（新到舊），含品項快照與取貨點名稱。
 * 訂單須即時，不走 unstable_cache。
 * 比對兩邊都正規化：既有資料寫入時未正規化，可能存有空白／連字號格式。
 */
export async function findOrdersByPhone(
  rawPhone: string,
): Promise<LookupOrder[]> {
  const phone = normalizePhone(rawPhone);
  const rows = (await sql`
    SELECT
      o.id,
      o.pickup_number,
      ps.code AS spot_code,
      o.customer_name,
      o.delivery_method,
      o.shipping_address,
      o.note,
      o.total,
      o.created_at,
      ps.city,
      ps.township,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'name', oi.product_name,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal
            )
            ORDER BY oi.id
          )
          FROM order_items oi
          WHERE oi.order_id = o.id
        ),
        '[]'::json
      ) AS items
    FROM orders o
    LEFT JOIN pickup_spots ps ON ps.id = o.pickup_spot_id
    WHERE o.phone = ${phone}
    ORDER BY o.created_at DESC
  `) as LookupRow[];
  return rows.map(toLookupOrder);
}
