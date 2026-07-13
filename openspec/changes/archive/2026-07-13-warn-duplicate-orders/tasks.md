## 1. 請求契約與純邏輯

- [x] 1.1 在共用 `PlaceOrderRequest`／回應型別加入可選的 `confirmDuplicate` 與 `DUPLICATE_ORDER` 結果形狀，保持既有呼叫端相容
- [x] 1.2 更新 `prepareOrder()`，只將嚴格布林值 `true` 正規化為已確認，並把結果傳給 server data layer
- [x] 1.3 擴充 `app/domain/order.test.ts`，涵蓋未提供、布林 true、false 與 truthy 非布林值的確認旗標

## 2. 伺服器端重複偵測與 API

- [x] 2.1 在 `app/lib/orders.ts` 新增參數化 `EXISTS` 查詢，以去除首尾空白的姓名與正規化電話共同比對所有既有訂單
- [x] 2.2 更新 `createOrder()`，讓未確認的疑似重複請求在解析寫入流程前回傳 `DUPLICATE_ORDER`，並讓已確認或未命中的請求沿用既有驗證、計價、庫存與快取流程
- [x] 2.3 更新 `POST /api/orders`，將 `DUPLICATE_ORDER` 映射為 HTTP 409 與指定警告訊息，並維持其他 validation error 為 400、成功為 201

## 3. 結帳確認互動

- [x] 3.1 重構 `CheckoutForm` 的訂單 payload 與送出函式，使第一次與確認請求共用同一份表單／購物車快照並可附加 `confirmDuplicate: true`
- [x] 3.2 新增符合 `DESIGN.md` 的疑似重複確認介面，顯示指定訊息及「返回確認」與「仍要送出」動作
- [x] 3.3 實作返回時保留表單與購物車、確認時重送，以及第一次請求／等待選擇／確認請求期間的防重複提交與一般錯誤分流

## 4. 驗證

- [x] 4.1 新增可在 Vitest 執行的純邏輯或元件測試，涵蓋雙欄位命中、單欄位不同、電話格式正規化、非布林旗標與重複回應分流
- [x] 4.2 新增或更新關鍵 Playwright 流程，以唯一測試資料驗證未重複直接成功、同姓名同電話收到提醒、返回不建立，以及確認後建立；僅在 allowlisted 測試 DB 執行
- [x] 4.3 執行 `npm run check` 與 `npm run build`，修正 lint、型別、單元測試及 production boundary 問題
- [x] 4.4 在允許寫入且不需清理的測試資料庫上執行目標 e2e，確認重複提醒請求不新增訂單或扣庫存，確認請求才產生一次新訂單

## 5. 姓名不可包含空白

- [x] 5.1 在 `app/lib/validation.ts` 新增前後端共用姓名驗證，於 `prepareOrder()` trim 前拒絕任何空白，並移除重複身分 helper 與 SQL 的姓名 trim／`btrim`
- [x] 5.2 更新 `CheckoutForm`，在送出前對含空白姓名顯示「姓名不可包含空白」
- [x] 5.3 擴充 Vitest 與 Playwright 規格，涵蓋一般空格、全形空格、Tab、無空白姓名及精確姓名比對，並將既有成功 e2e 姓名 fixture 改為不含空白
- [x] 5.4 執行 `npm run check`、`npm run build` 與目標 desktop e2e，確認追加規則及既有重複訂單流程皆通過
