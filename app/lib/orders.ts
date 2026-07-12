import { sql } from "@/app/lib/db";
import { getProducts } from "@/app/lib/products";
import { prepareOrder } from "@/app/domain/order";
import { normalizePhone } from "@/app/lib/validation";
import type {
  LookupOrder,
  OrderConfirmation,
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

/**
 * 驗證請求、依後端商品目錄重算價格、寫入訂單與明細。
 * 回傳 { order } 或 { error }（由呼叫端決定回應 400/500）。
 * 重點：完全不信任前端送來的價格，價格/促銷一律以資料庫為準。
 */
export async function createOrder(
  raw: unknown,
): Promise<{ order: OrderConfirmation } | { error: string }> {
  const products = await getProducts();
  const prepared = prepareOrder(raw, products);
  if ("error" in prepared) return prepared;
  const value = prepared.value;

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

  // 建單：取貨單需在同一取貨點內遞增號碼牌，撞唯一鍵時重試。
  const order = await insertOrder({
    customerName: value.customerName,
    phone: value.phone,
    deliveryMethod: value.deliveryMethod,
    pickupSpotId,
    shippingAddress,
    note: value.note,
    total: value.total,
  });

  // 寫入明細；任一步失敗就回收訂單（ON DELETE CASCADE 一併清掉已寫入的明細）。
  try {
    for (const li of value.lines) {
      await sql`
        INSERT INTO order_items
          (order_id, product_id, product_name, unit_price, quantity,
           promo_type, promo_config, subtotal)
        VALUES
          (${order.id}, ${li.productId}, ${li.productName}, ${li.unitPrice},
           ${li.quantity}, ${li.promoType}, ${li.promoConfig}::jsonb,
           ${li.subtotal})
      `;
    }
  } catch (err) {
    await sql`DELETE FROM orders WHERE id = ${order.id}`.catch(() => { });
    throw err;
  }

  return {
    order: {
      total: value.total,
      deliveryMethod: value.deliveryMethod,
      pickupCode: formatPickupCode(spotCode, order.pickupNumber),
    },
  };
}

interface InsertOrderArgs {
  customerName: string;
  phone: string;
  deliveryMethod: "pickup" | "delivery";
  pickupSpotId: number | null;
  shippingAddress: string | null;
  note: string | null;
  total: number;
}

async function insertOrder(
  args: InsertOrderArgs,
): Promise<{ id: number, pickupNumber: number }> {
  for (let attempt = 0; attempt < PICKUP_NUMBER_RETRIES; attempt++) {
    try {
      const rows = (await sql`
        INSERT INTO orders
          (customer_name, phone, delivery_method, pickup_spot_id, shipping_address,
           pickup_number, note, total)
        VALUES
          (${args.customerName}, ${args.phone}, ${args.deliveryMethod}, ${args.pickupSpotId}, ${args.shippingAddress},
           (SELECT COALESCE(MAX(pickup_number), 0) + 1
              FROM orders WHERE pickup_spot_id IS NOT DISTINCT FROM ${args.pickupSpotId}),
           ${args.note}, ${args.total})
        RETURNING id, pickup_number
      `) as { id: number; pickup_number: number }[];
      return { id: rows[0].id, pickupNumber: rows[0].pickup_number };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < PICKUP_NUMBER_RETRIES - 1) {
        continue;
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
    WHERE regexp_replace(o.phone, '[\\s-]', '', 'g') = ${phone}
    ORDER BY o.created_at DESC
  `) as LookupRow[];
  return rows.map(toLookupOrder);
}
