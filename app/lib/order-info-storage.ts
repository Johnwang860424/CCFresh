// 訂購資料記憶：localStorage 讀寫 + 形狀驗證。
// 比照 promotions.ts / validation.ts，client + server 皆可 import（實際只在 client 呼叫）。
import { OrderFormData } from "@/types";

export const ORDER_INFO_STORAGE_KEY = "cc_fresh_order_info";

// location 為送出時才組出的顯示字串，不儲存。
export type SavedOrderInfo = Omit<OrderFormData, "location">;

export function saveOrderInfo(data: SavedOrderInfo): void {
  // localStorage 在無痕/隱私設定下可能直接 throw；記憶功能失效不得影響下單流程。
  try {
    localStorage.setItem(ORDER_INFO_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 靜默略過
  }
}

const isString = (v: unknown) => typeof v === "string";

// Record<keyof SavedOrderInfo, ...> 讓欄位清單與型別掛鉤：
// OrderFormData 日後增欄時這裡會編譯錯誤，避免驗證器悄悄漏檢新欄位。
const FIELD_VALIDATORS: Record<keyof SavedOrderInfo, (v: unknown) => boolean> =
  {
    name: isString,
    phone: isString,
    deliveryMethod: (v) => v === "pickup" || v === "delivery",
    city: isString,
    township: isString,
    address: isString,
    // 與 UI 的 maxLength={100} 一致；程式塞入的超長值不受 maxLength 限制，須在此擋下
    remarks: (v) => typeof v === "string" && v.length <= 100,
  };

function isSavedOrderInfo(value: unknown): value is SavedOrderInfo {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(FIELD_VALIDATORS) as (keyof SavedOrderInfo)[]
  ).every((field) => FIELD_VALIDATORS[field](record[field]));
}

function removeSavedOrderInfo(): void {
  try {
    localStorage.removeItem(ORDER_INFO_STORAGE_KEY);
  } catch {
    // 靜默略過
  }
}

export function loadSavedOrderInfo(): SavedOrderInfo | null {
  try {
    const raw = localStorage.getItem(ORDER_INFO_STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isSavedOrderInfo(parsed)) return parsed;
  } catch {
    // JSON 解析失敗：落到下方的自我修復
  }
  // 非法 JSON 或形狀不符（舊版格式等）：自我修復，移除壞資料。
  removeSavedOrderInfo();
  return null;
}
