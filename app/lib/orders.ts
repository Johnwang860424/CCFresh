import { sql } from "@/app/lib/db";
import { getProducts } from "@/app/lib/products";
import {
  buildEffectiveCatalog,
  calcStockDeltas,
  prepareOrder,
  type HeldQuantity,
  type OrderLine,
  type PreparedOrder,
} from "@/app/domain/order";
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
// held＝原訂單持有量（改單時會釋回，計入可售），建單時為空。
async function buildStockInsufficientError(
  lines: OrderLine[],
  held: HeldQuantity[] = [],
): Promise<string> {
  const ids = lines.map((li) => li.productId);
  const rows = (await sql`
    SELECT id, name, stock FROM products WHERE id = ANY(${ids})
  `) as { id: number; name: string; stock: number | null }[];
  const wantedById = new Map(lines.map((li) => [li.productId, li.quantity]));
  const heldById = new Map(held.map((h) => [h.productId, h.quantity]));
  const parts = rows
    .filter((r) => {
      if (r.stock === null) return false;
      const available = r.stock + (heldById.get(r.id) ?? 0);
      return (wantedById.get(r.id) ?? 0) > available;
    })
    .map(
      (r) =>
        `「${r.name}」庫存不足（剩餘 ${(r.stock ?? 0) + (heldById.get(r.id) ?? 0)}）`,
    );
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
  const dest = await resolveDestination(value);
  if ("error" in dest) return dest;

  // 建單：訂單、明細、扣庫存以單一 CTE 語句原子寫入（Neon HTTP 無互動式交易）。
  // 取貨單需在同一取貨點內遞增號碼牌，撞唯一鍵時重試。
  const result = await insertOrder({
    customerName: value.customerName,
    phone: value.phone,
    deliveryMethod: value.deliveryMethod,
    pickupSpotId: dest.pickupSpotId,
    shippingAddress: dest.shippingAddress,
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
      pickupCode: formatPickupCode(dest.spotCode, result.pickupNumber),
    },
  };
}

interface Destination {
  pickupSpotId: number | null;
  spotCode: string | null;
  shippingAddress: string | null;
}

// 取貨方式欄位：自取解析取貨點（不存在＝錯誤），宅配帶地址。
async function resolveDestination(
  value: PreparedOrder,
): Promise<Destination | { error: string }> {
  if (value.deliveryMethod === "delivery") {
    return { pickupSpotId: null, spotCode: null, shippingAddress: value.address };
  }
  const spots = (await sql`
    SELECT id, code FROM pickup_spots
    WHERE city = ${value.city} AND township = ${value.township}
    LIMIT 1
  `) as { id: number; code: string }[];
  if (spots.length === 0) return { error: "取貨地點不存在" };
  return { pickupSpotId: spots[0].id, spotCode: spots[0].code, shippingAddress: null };
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

// unnest 用的平行陣列（promo_config 以 text[] 傳入，於 SELECT 時逐筆轉 jsonb）。
// prepareOrder 已合併重複商品，一商品恰一列，扣庫存的 UPDATE 不會重複命中同列。
function toUnnestArrays(lines: OrderLine[]) {
  return {
    productIdArr: lines.map((li) => li.productId),
    productNameArr: lines.map((li) => li.productName),
    unitPriceArr: lines.map((li) => li.unitPrice),
    quantityArr: lines.map((li) => li.quantity),
    promoTypeArr: lines.map((li) => li.promoType),
    promoConfigArr: lines.map((li) => li.promoConfig),
    subtotalArr: lines.map((li) => li.subtotal),
  };
}

async function insertOrder(
  args: InsertOrderArgs,
): Promise<{ id: number; pickupNumber: number } | { error: string }> {
  const {
    productIdArr,
    productNameArr,
    unitPriceArr,
    quantityArr,
    promoTypeArr,
    promoConfigArr,
    subtotalArr,
  } = toUnnestArrays(args.lines);

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
  phone: string;
  delivery_method: "pickup" | "delivery";
  shipping_address: string | null;
  note: string | null;
  total: number;
  created_at: string | Date;
  city: string | null;
  township: string | null;
  items: {
    product_id: number;
    name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[];
}

function toLookupOrder(row: LookupRow): LookupOrder {
  return {
    id: String(row.id),
    pickupCode: formatPickupCode(row.spot_code, row.pickup_number),
    customerName: row.customer_name,
    phone: row.phone,
    deliveryMethod: row.delivery_method,
    location:
      row.delivery_method === "pickup"
        ? `${row.city ?? ""}${row.township ?? ""}`
        : (row.shipping_address ?? ""),
    city: row.city ?? "",
    township: row.township ?? "",
    address: row.shipping_address ?? "",
    items: row.items.map((item) => ({
      productId: String(item.product_id),
      name: item.name,
      unitPrice: Number(item.unit_price),
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
      o.phone,
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
              'product_id', oi.product_id,
              'name', oi.product_name,
              'unit_price', oi.unit_price,
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

export type UpdateOrderResult =
  | { order: LookupOrder }
  | { error: string; notFound?: boolean };

/**
 * 更新既有訂單。憑證＝訂單 id + 查詢時輸入的電話（lookupPhone），不命中回 notFound。
 * 內容走與下單同一套 prepareOrder 重驗證計價（現行目錄價格，不信任前端金額）；
 * 庫存預檢以有效可售量（目前庫存＋原單持有量）為準。
 * 訂單欄位、明細替換與庫存差額調整在單一 CTE 原子完成；
 * 換取貨點／換取貨方式時號碼牌於新 scope 重新編派（MAX+1，撞唯一鍵重試）。
 */
export async function updateOrder(
  rawId: string,
  raw: unknown,
): Promise<UpdateOrderResult> {
  const orderId = Number(rawId);
  const lookupPhone =
    typeof raw === "object" && raw !== null
      ? (raw as { lookupPhone?: unknown }).lookupPhone
      : undefined;
  if (!Number.isInteger(orderId) || typeof lookupPhone !== "string") {
    return { error: "查無此訂單", notFound: true };
  }

  const originals = (await sql`
    SELECT
      o.pickup_spot_id,
      o.created_at,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object('product_id', oi.product_id, 'quantity', oi.quantity)
          )
          FROM order_items oi
          WHERE oi.order_id = o.id
        ),
        '[]'::json
      ) AS items
    FROM orders o
    WHERE o.id = ${orderId} AND o.phone = ${normalizePhone(lookupPhone)}
  `) as {
    pickup_spot_id: number | null;
    created_at: string | Date;
    items: { product_id: number; quantity: number }[];
  }[];
  if (originals.length === 0) return { error: "查無此訂單", notFound: true };
  const original = originals[0];
  const held: HeldQuantity[] = original.items.map((it) => ({
    productId: Number(it.product_id),
    quantity: Number(it.quantity),
  }));

  const products = await getProducts();
  const prepared = prepareOrder(raw, buildEffectiveCatalog(products, held));
  if ("error" in prepared) return prepared;
  const value = prepared.value;

  const dest = await resolveDestination(value);
  if ("error" in dest) return dest;

  const deltas = calcStockDeltas(
    held,
    value.lines.map((li) => ({ productId: li.productId, quantity: li.quantity })),
  );

  const result = await runOrderUpdate(orderId, value, dest, deltas, held);
  if ("error" in result) return result;

  // 庫存有變動才需要讓兩邊目錄反映新剩餘量。
  if (deltas.length > 0) await revalidateCache("products");

  const isPickup = value.deliveryMethod === "pickup";
  return {
    order: {
      id: String(orderId),
      pickupCode: formatPickupCode(dest.spotCode, result.pickupNumber),
      customerName: value.customerName,
      phone: value.phone,
      deliveryMethod: value.deliveryMethod,
      location: isPickup ? `${value.city}${value.township}` : value.address,
      city: isPickup ? value.city : "",
      township: isPickup ? value.township : "",
      address: isPickup ? "" : value.address,
      items: value.lines.map((li) => ({
        productId: String(li.productId),
        name: li.productName,
        unitPrice: li.unitPrice,
        quantity: li.quantity,
        subtotal: li.subtotal,
      })),
      total: value.total,
      note: value.note,
      createdAt: new Date(original.created_at).toISOString(),
    },
  };
}

async function runOrderUpdate(
  orderId: number,
  value: PreparedOrder,
  dest: Destination,
  deltas: { productId: number; delta: number }[],
  held: HeldQuantity[],
): Promise<{ pickupNumber: number } | { error: string }> {
  const {
    productIdArr,
    productNameArr,
    unitPriceArr,
    quantityArr,
    promoTypeArr,
    promoConfigArr,
    subtotalArr,
  } = toUnnestArrays(value.lines);
  const deltaIdArr = deltas.map((d) => d.productId);
  const deltaArr = deltas.map((d) => d.delta);

  for (let attempt = 0; attempt < PICKUP_NUMBER_RETRIES; attempt++) {
    try {
      const rows = (await sql`
        WITH upd AS (
          UPDATE orders SET
            customer_name = ${value.customerName},
            phone = ${value.phone},
            delivery_method = ${value.deliveryMethod},
            pickup_spot_id = ${dest.pickupSpotId},
            shipping_address = ${dest.shippingAddress},
            note = ${value.note},
            total = ${value.total},
            -- SET 右側的欄位參照皆為舊值：取貨點沒變就保留原號碼牌，
            -- 有變才在新 scope 取 MAX+1（撞唯一鍵由外層重試）。
            pickup_number = CASE
              WHEN pickup_spot_id IS NOT DISTINCT FROM ${dest.pickupSpotId}
                THEN pickup_number
              ELSE (
                SELECT COALESCE(MAX(o2.pickup_number), 0) + 1
                FROM orders o2
                WHERE o2.pickup_spot_id IS NOT DISTINCT FROM ${dest.pickupSpotId}
              )
            END
          WHERE id = ${orderId}
          RETURNING pickup_number
        ),
        del AS (
          DELETE FROM order_items WHERE order_id = ${orderId}
        ),
        ins AS (
          INSERT INTO order_items
            (order_id, product_id, product_name, unit_price, quantity,
             promo_type, promo_config, subtotal)
          SELECT ${orderId}, t.product_id, t.product_name, t.unit_price, t.quantity,
                 t.promo_type, t.promo_config::jsonb, t.subtotal
          FROM unnest(
            ${productIdArr}::int[],
            ${productNameArr}::text[],
            ${unitPriceArr}::int[],
            ${quantityArr}::int[],
            ${promoTypeArr}::text[],
            ${promoConfigArr}::text[],
            ${subtotalArr}::int[]
          ) AS t(product_id, product_name, unit_price, quantity,
                 promo_type, promo_config, subtotal)
        ),
        dec AS (
          -- 差額調整：正值扣庫存、負值還庫存；不追蹤庫存者不動。
          -- 扣到負值違反 products_stock_nonneg CHECK，整句失敗＝零部分效果。
          UPDATE products p
          SET stock = p.stock - t.delta
          FROM unnest(
            ${deltaIdArr}::int[],
            ${deltaArr}::int[]
          ) AS t(product_id, delta)
          WHERE p.id = t.product_id AND p.stock IS NOT NULL
        )
        SELECT pickup_number FROM upd
      `) as { pickup_number: number }[];
      return { pickupNumber: rows[0].pickup_number };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < PICKUP_NUMBER_RETRIES - 1) {
        continue;
      }
      if (isStockCheckViolation(err)) {
        return { error: await buildStockInsufficientError(value.lines, held) };
      }
      throw err;
    }
  }
  throw new Error("無法配發訂單號碼，請重試");
}
