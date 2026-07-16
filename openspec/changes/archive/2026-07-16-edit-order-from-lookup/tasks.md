## 1. 型別與查詢回應擴充

- [x] 1.1 `types.ts`：`LookupOrderItem` 加 `productId`、`unitPrice`；`LookupOrder` 加 `phone`、`city`、`township`、`address`；新增 `UpdateOrderRequest`（`PlaceOrderRequest` + `lookupPhone`，去掉 `confirmDuplicate`）
- [x] 1.2 `app/lib/orders.ts`：`findOrdersByPhone` SQL 與 `toLookupOrder` 帶出新欄位（phone、city/township、address、items 的 product_id/unit_price）

## 2. Domain 純函式（先寫測試）

- [x] 2.1 `app/domain/order.ts`：`buildEffectiveCatalog(products, originalLines)` — 以原訂單持有量墊高 stock 供 `prepareOrder` 預檢；配 colocated 測試（追蹤/不追蹤庫存、原單持有、新商品）
- [x] 2.2 `app/domain/order.ts`：`calcStockDeltas(originalLines, newLines)` — 每商品「新 − 舊」差額（含移除為負、新增為正、不變為 0 略過）；配測試

## 3. 更新資料層與 API

- [x] 3.1 `app/lib/orders.ts`：`updateOrder(orderId, raw)` — 以 id + 正規化 `lookupPhone` 撈原訂單（含明細）否則 404；`prepareOrder` 用 effective catalog 重驗證計價；解析取貨點
- [x] 3.2 `updateOrder` 單一 CTE：`UPDATE orders`（spot 變動時 CASE 重編號 MAX+1）＋ `DELETE`/`INSERT order_items` ＋ 差額 `UPDATE products.stock`；23505 重試、23514 組庫存不足訊息；庫存有差額時 `revalidateCache("products")`；回傳更新後 `LookupOrder`
- [x] 3.3 `app/api/orders/[id]/route.ts`：PUT handler — 404/400/200 分流，沿用 `jsonHandler` 慣例

## 4. 編輯 UI（OrderLookup.tsx）

- [x] 4.1 訂單卡加「編輯」鈕與編輯模式狀態；編輯表單欄位：姓名、電話、取貨方式切換、縣市/鄉鎮下拉（`useResource` `/api/pickup-spots`）、地址、備註（驗證沿用 `validation.ts`）
- [x] 4.2 品項編輯：數量 stepper（上限＝有效可售量，達上限 disable `+` 並提示「已達庫存上限（最多可訂 N）」）、刪除、新增商品下拉（`useResource` `/api/products`，售完標示不可選）；已下架品項標示並要求移除；即時以 `calcLineSubtotal` 重算總額
- [x] 4.3 儲存：PUT 成功就地替換該卡並退出編輯；`pickupCode` 變動時顯著提示新號碼；400 錯誤顯示於表單內且保留輸入

## 5. 驗證

- [x] 5.1 `npm run check`（lint + typecheck + vitest）通過
- [x] 5.2 `npm run dev` 手動走一遍：改數量（含超庫存擋下）、換取貨點（號碼變動提示）、自取改宅配、改訂購人
