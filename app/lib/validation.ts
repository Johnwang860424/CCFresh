// 共用驗證工具：前後端皆可引入（勿引入 server-only 依賴）。

// 台灣手機格式（容忍空白／連字號）。
const TW_MOBILE = /^09\d{8}$/;
const CUSTOMER_NAME_WHITESPACE = /\s/u;

/** 姓名必須有內容，且不得包含一般／全形空格、Tab、換行等空白字元。 */
export function isValidCustomerName(name: string): boolean {
  return name.length > 0 && !CUSTOMER_NAME_WHITESPACE.test(name);
}

/** 去除空白與連字號，回傳純數字電話字串。 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

/** 是否為有效的台灣手機號碼。 */
export function isValidTwMobile(phone: string): boolean {
  return TW_MOBILE.test(normalizePhone(phone));
}

/**
 * 限制輸入的聯絡電話格式：
 * 1. 僅允許數字
 * 2. 限制最大長度為 10 位數
 */
export function sanitizePhoneInput(value: string): string {
  // 僅允許數字，且最多 10 位
  return value.replace(/[^\d]/g, "").slice(0, 10);
}
