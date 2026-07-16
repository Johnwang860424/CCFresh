# Proposal: edit-order-from-lookup

## Why

顧客下單後若想改數量、換取貨點、改地址或改訂購人資訊，目前只能透過人工聯繫店家重新處理。查詢訂單頁已能以電話找到自己的訂單，讓顧客在同一處直接自助改單可大幅減少人工溝通成本。

## What Changes

- 查詢訂單結果的每張訂單卡新增「編輯」功能：品項（增、刪、改數量）、取貨方式（自取⇄宅配）、取貨點、宅配地址、訂購人姓名、電話、備註皆可修改。
- 新增 `PUT /api/orders/[id]` 端點：以查詢時的電話（`lookupPhone`）作為授權憑證，與查詢同一信任等級。
- 更新走與下單同一套 `prepareOrder` 驗證與計價（現行目錄價格重算，不信任前端金額）。
- 庫存以「新數量 − 舊數量」差額原子調整（單一 CTE），防超賣仍由 `products_stock_nonneg` 約束保證；顧客改單可訂上限 = 目前庫存 + 原訂單持有量。
- 換取貨點或換取貨方式時號碼牌重新編派（每點獨立流水號的唯一鍵所致），UI 明確提示新號碼。
- 訂單隨時可編輯，無時間或狀態限制。
- 查詢 API 回傳擴充編輯所需欄位（電話、縣市/取貨點、地址、品項 productId/單價）。

## Capabilities

### New Capabilities
- `order-editing`: 查詢後自助編輯訂單——授權模型、更新 API 的驗證/計價/庫存差額/重新編號規則、編輯表單 UI 與庫存上限呈現。

### Modified Capabilities
- `order-lookup-by-phone`: 查詢回應每筆訂單新增編輯所需欄位（phone、city/township、address、items 的 productId/unitPrice/quantity）。

## Impact

- `app/lib/orders.ts` — 新增 `updateOrder()`；`findOrdersByPhone` 查詢欄位擴充。
- `app/domain/order.ts` — 庫存差額與有效可售量純函式（含測試）。
- `app/api/orders/[id]/route.ts` — 新 PUT 端點。
- `types.ts` — `LookupOrder`/`LookupOrderItem` 擴充、更新請求型別。
- `components/OrderLookup.tsx` — 訂單卡編輯模式（自行載入 `/api/products`、`/api/pickup-spots`）。
- 資料庫 schema 無變更；不影響管理端（庫存變動後照舊 `revalidateCache("products")` 回敲）。
