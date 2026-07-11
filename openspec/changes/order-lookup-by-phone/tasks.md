# Tasks: 電話查詢訂單

> 節奏：每完成一項 → 瀏覽器目視或跑測試確認 → 打勾 → 下一項。

## T1. 資料層

- [ ] T1.1 `types.ts` 新增 `LookupOrder`（含 `items[]`）型別
- [ ] T1.2 `app/lib/orders.ts` 新增 `findOrdersByPhone()`：正規化比對（SQL 兩邊 normalize）、`ORDER BY created_at DESC` 回傳全部、JOIN `order_items` 與 `pickup_spots`、不走 `unstable_cache`
- [ ] T1.3 `createOrder` 儲存電話改為 `normalizePhone(phone)`（舊資料不 backfill）
- [ ] T1.4 目視驗證：以測試庫既有資料（含帶連字號電話）呼叫確認命中與排序

## T2. API

- [ ] T2.1 新增 `app/api/orders/lookup/route.ts`：POST、格式錯誤 400、成功 200 `{ orders }`（0 筆＝空陣列）、例外 500
- [ ] T2.2 目視驗證：curl 打 400／200 有資料／200 空陣列三種情境

## T3. 查詢區塊 UI

- [ ] T3.1 新增 `components/OrderLookup.tsx`：白底區塊 + `max-w-2xl` 卡片、電話輸入（`isValidTwMobile` 前端驗證）＋查詢按鈕（查詢中 disabled）
- [ ] T3.2 結果列表：`max-h` + `overflow-y-auto` 內部捲動；每筆顯示取貨編號、姓名、品項明細、總金額（主）＋取貨資訊、時間、備註（次）
- [ ] T3.3 空狀態「查無此電話的訂單」與 API 失敗紅底警示列
- [ ] T3.4 `App.tsx` 於 `<CheckoutForm/>` 之後、footer 之前掛入（`id="order-lookup"`）
- [ ] T3.5 目視驗證：桌面與手機寬度下版面整齊、多筆訂單時卡片內部捲動、頁面長度不變

## T4. Navbar 入口

- [ ] T4.1 桌面連結列與手機選單各加「查詢訂單」，smooth scroll 至 `#order-lookup`（手機點擊後關閉選單）
- [ ] T4.2 目視驗證：兩種寬度下點擊皆正確捲動

## T5. E2E 測試（最後任務群）

- [x] T5.1 確認 Playwright 基礎建設可用：已隨 2026-07-11 合併 main 帶入（config、`e2e/`、共用下單 helper 齊備）
- [ ] T5.2 `e2e/order-lookup.spec.ts`：真實下單（可重用 `e2e/helpers.ts` 共用下單 helper）→ 同電話查詢 → 驗證編號／姓名／品項／金額
- [ ] T5.3 同檔：帶連字號下單、純數字查詢命中（正規化比對）
- [ ] T5.4 同檔：查無資料空狀態、格式錯誤前端擋下
- [ ] T5.5 `npm run test:e2e` 全綠

## 實作前置檢查（設計確認後）

- [ ] 功能分支：`feat/Celia/orderLookupByPhone`（基於 main，需求方指定）
- [ ] Schema：無改動（`orders` 已有 `created_at`），不需 migration
- [ ] 角色/權限：無新增，不需測試帳號 env vars
- [ ] 技術遷移：無
