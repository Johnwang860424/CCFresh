# Design: edit-order-from-lookup

## Context

查詢訂單（`POST /api/orders/lookup`）目前只憑電話回傳唯讀訂單清單。下單路徑已具備完整的驗證/計價/防超賣機制：`prepareOrder`（純函式驗證＋以資料庫目錄重算價格）、`insertOrder`（訂單＋明細＋扣庫存單一 CTE 原子寫入，`products_stock_nonneg` CHECK 防超賣、`(pickup_spot_id, pickup_number)` 唯一鍵配重試）。Neon HTTP driver 無互動式交易，所有多表寫入必須擠進單一 SQL 語句。

號碼牌 `pickup_number` 為每取貨點獨立流水號（宅配為 NULL 點全域流水號），是顧客取貨的唯一憑證。

## Goals / Non-Goals

**Goals:**
- 顧客查到訂單後可自助修改：品項增刪改、取貨方式、取貨點、地址、訂購人姓名、電話、備註。
- 更新沿用下單同一套驗證與計價；庫存原子差額調整，永不超賣。
- 換取貨點/換方式時號碼牌重新編派並明確告知。

**Non-Goals:**
- 取消訂單／刪除訂單（未要求）。
- 編輯時間窗或訂單狀態限制（確認為隨時可改）。
- OTP 或其他強驗證（沿用查詢的電話信任等級）。
- 管理端 app 的任何變更。

## Decisions

**D1: 授權＝知道訂單電話（與查詢同信任等級）。**
`PUT /api/orders/[id]` body 帶 `lookupPhone`（查詢時輸入的電話），伺服端以 `id + normalizePhone(lookupPhone)` 比對 `orders.phone` 命中才准改。電話本身也是可編輯欄位，故憑證與新值分離。替代方案（OTP、編輯碼）成本高，小型團購場景不需要。

**D2: 整單替換而非欄位級 PATCH。**
更新請求即 `PlaceOrderRequest` 形狀（＋`lookupPhone`），完整過 `prepareOrder` 重驗證重計價。金額一律以現行目錄價格重算——與「不信任前端價格」既有原則一致；商品若曾改價，改單後金額隨現價變動（接受的行為）。替代方案「取消重建」在無交易環境下兩步之間失敗會遺失訂單，否決。

**D3: 庫存差額調整，單一 CTE 原子完成。**
每商品調整量 = 新數量 − 舊數量（移除的品項差額為負＝還庫存；新加的為正＝扣庫存）。`UPDATE orders`（含條件重編號）、`DELETE order_items`、`INSERT order_items`、庫存差額 `UPDATE` 全在一句 CTE。超賣仍由 `products_stock_nonneg` CHECK 全句原子擋下（SQLSTATE 23514 → 重查庫存組「庫存不足」訊息，與下單同款）。純計算（差額、有效可售量）放 `app/domain/order.ts` 配 vitest。

**D4: 庫存預檢以「有效可售量」為準。**
有效可售量 = 目前庫存 + 該商品在原訂單的數量（原訂單佔的量改單時會還回）。`prepareOrder` 的預檢目錄在呼叫前先以原訂單數量墊高 stock，即可原樣重用其「庫存不足（剩餘 N）」訊息邏輯，不需改 `prepareOrder` 本體。

**D5: 換點/換方式才重新編號。**
`pickup_spot_id` 不變則保留原 `pickup_number`；有變則在新 scope 取 `MAX+1`（SQL `CASE`），撞 23505 唯一鍵沿用既有重試模式。回應帶新 `pickupCode`，UI 在號碼變動時顯著提示。

**D6: 編輯 UI 內嵌於訂單卡，資料自載。**
`OrderLookup` 卡片切換編輯模式；商品目錄與取貨點以 `useResource` 各自載入（與 `CheckoutForm` 同模式），不從 `App` 傳 props。數量 stepper 上限 = 有效可售量，達上限 `+` disable 並顯示「已達庫存上限（最多可訂 N）」；新增商品下拉中有效可售量 0 的商品標示售完不可選。儲存成功以回傳的更新後 `LookupOrder` 就地替換該卡。

**D7: 查詢回應擴充編輯基底欄位。**
`LookupOrder` 加 `phone`、`city`、`township`、`address`、`note` 既有；items 加 `productId`、`unitPrice`。查詢 SQL 已 join 所需資料表，僅增列欄位，無額外查詢。

## Risks / Trade-offs

- [併發改單/下單搶同庫存] → CHECK 約束全句原子失敗，回友善 400，表單保留輸入讓顧客調整重送。
- [商品改價後改單金額變動] → 接受；編輯表單即時以現價重算並顯示總額，顧客儲存前看得到。
- [同一訂單兩人同時編輯] → 後寫覆蓋先寫（last-write-wins）。小場景接受，不做版本鎖。
- [宅配單重編號在高併發下可能重號] → 與既有下單相同的已接受 trade-off（NULL 逃脫唯一鍵）。
- [品項被下架（不在 getProducts 目錄）] → 該品項無法保留於編輯後訂單（prepareOrder 會拒絕未知商品）；UI 以現行目錄呈現可選項，下架品項顯示為不可保留並提示移除。
