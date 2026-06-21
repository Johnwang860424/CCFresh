// 共用驗證工具：前後端皆可引入（勿引入 server-only 依賴）。

// 台灣手機格式（容忍空白／連字號）。
const TW_MOBILE = /^09\d{8}$/;

/** 去除空白與連字號，回傳純數字電話字串。 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

/** 是否為有效的台灣手機號碼。 */
export function isValidTwMobile(phone: string): boolean {
  return TW_MOBILE.test(normalizePhone(phone));
}
