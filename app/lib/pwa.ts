// PWA 裝置偵測工具：client + server 皆可 import（無 server-only 相依），
// 無 window 環境（SSR）一律回傳「不適用」，不丟例外。

export type PwaPlatform = "ios" | "android";

/**
 * 判斷目前裝置是否為可引導加入桌面的行動平台；桌機、無法辨識，
 * 或 in-app 瀏覽器（沒有「加入主畫面」入口）回傳 null。
 */
export function detectPwaPlatform(): PwaPlatform | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent;
  // LINE / Facebook / Instagram 內建瀏覽器與 Android WebView 沒有
  // 分享→加入主畫面的入口，教學無法照做，不引導
  if (/ line\/|fban|fbav|instagram|; wv\)/i.test(ua)) return null;

  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS 13+ 的 Safari 預設回報桌面版 Mac UA，靠多點觸控辨識
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/android/i.test(ua)) return "android";
  return null;
}

/** 是否已從桌面圖示以獨立視窗開啟（此時不需再引導加入桌面） */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari 專屬屬性，不在標準 Navigator 型別內
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
