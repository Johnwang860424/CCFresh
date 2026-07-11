# Proposal: 電話查詢訂單（order-lookup-by-phone）

## Why

顧客下單後沒有任何管道回頭確認自己的訂單——號碼牌幾號、訂了哪些品項、金額多少，只能靠截圖成功彈窗或直接詢問賣家。新增一個免帳號的「查詢訂單」區塊：輸入下單時的手機號碼，即可查到該電話的全部訂單，降低對帳與客服詢問成本。

## What Changes

1. **資料層**：`app/lib/orders.ts` 新增 `findOrdersByPhone()`——以正規化後的電話比對，回傳該電話**全部**訂單（新到舊），含品項明細與取貨點名稱。即時查詢、不走 `unstable_cache`。
2. **寫入端正規化**：`createOrder` 改為儲存 `normalizePhone()` 後的電話（目前只 trim，資料庫可能存有 `0912-345-678` 這類格式）。舊資料不 backfill，由查詢端的正規化比對涵蓋。
3. **API**：新增 `POST /api/orders/lookup`，body 為 `{ phone }`。用 POST 避免電話進入 URL、log 與快取層。格式錯誤回 400；查無資料回 200 空陣列。
4. **UI**：新增 `components/OrderLookup.tsx` 區塊，放在結帳區之後、footer 之前（`id="order-lookup"`），沿用結帳卡片的設計語言。結果列表以固定高度內部捲動呈現，不隨訂單數把頁面拉長。
5. **Navbar 入口**：桌面連結列與手機選單各加「查詢訂單」項目，smooth scroll 至該區塊。
6. **Playwright e2e**：新增 `e2e/order-lookup.spec.ts` 覆蓋查得到、查無資料、格式驗證情境。

## Out of Scope

- 訂單處理狀態（處理中／已出貨等）——`orders` 表無 status 欄位，且需要管理端配套，另開需求
- 個資遮罩、驗證碼、rate limiting（需求方已確認：只憑電話、完整顯示）
- 查詢結果的筆數／時間上限（需求方已確認：回傳全部訂單）
- 訂單修改、取消

## Impact

- 新增：`components/OrderLookup.tsx`、`app/api/orders/lookup/route.ts`、`e2e/order-lookup.spec.ts`
- 修改：`app/lib/orders.ts`（新增 `findOrdersByPhone`、`createOrder` 改存正規化電話）、`components/App.tsx`（掛入區塊）、`components/Navbar.tsx`（查詢入口）、`types.ts`（查詢回應型別）
- 不動：資料庫 schema（`orders` 已有 `created_at` 可排序）、既有快取機制、購物車與結帳流程
- **前置相依**：Playwright 基礎建設（`playwright.config.ts`、`e2e/`、`test:e2e` script）目前不在 main 上（在 `pwa-install-prompt` 變更的分支）。本變更的 e2e 任務需等其合併進本分支，或先把 Playwright 設定帶進來。
