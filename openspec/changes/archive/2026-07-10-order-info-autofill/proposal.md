# Proposal: 訂購資料記憶自動帶入（order-info-autofill）

## Why

回頭客每次下單都要重填姓名、電話、取貨資訊，在手機上尤其麻煩。客戶成功送出過訂單後，把訂購資料存在裝置上，下次結帳自動帶入，消費者不需要再填——降低回購下單的門檻。

## What Changes

1. **儲存模組**：新增 `app/lib/order-info-storage.ts`，封裝 localStorage key `cc_fresh_order_info` 的讀寫與形狀驗證。
2. **下單成功後儲存**：`CheckoutForm` 在訂單送出成功（API 2xx）後，把整份表單七欄存入裝置——`name`、`phone`、`deliveryMethod`、`city`、`township`、`address`、`remarks`（**含備註**）。失敗的嘗試不覆蓋既有資料。
3. **開站自動帶入**：結帳表單 mount 後自動預填上次的訂購資料，使用者可直接修改。不做「詢問是否帶入」提示、不做清除按鈕。
4. **下架地點防護**：帶入的取貨地點若已不在最新 `pickup_spots` 清單，清空地點欄位（其餘照帶），由既有表單驗證引導重選。
5. **Playwright e2e**：新增 `e2e/order-info-autofill.spec.ts` 覆蓋帶入、下架地點、壞資料情境。

## Out of Scope

- 過期時間 / 清除已存資料按鈕（需求方已確認採無條件自動帶入）
- 訂單品項記憶（購物車已有 `cc_fresh_cart` 持久化與對帳機制）
- 跨裝置同步、會員系統、後端變更（`createOrder` 驗證照舊把關）

## Impact

- 新增：`app/lib/order-info-storage.ts`、`e2e/order-info-autofill.spec.ts`
- 修改：`components/CheckoutForm.tsx`（讀取帶入＋成功後儲存＋下架地點檢查）
- 不動：資料庫 schema、API routes、`app/lib/orders.ts`、購物車持久化
- **前置相依**：Playwright 基礎建設（`playwright.config.ts`、`e2e/`、`test:e2e` script）目前在 `pwa-install-prompt` 變更的分支上、尚未進 main。本變更的 e2e 任務需等該分支合併，或先把 Playwright 設定帶進本分支。
