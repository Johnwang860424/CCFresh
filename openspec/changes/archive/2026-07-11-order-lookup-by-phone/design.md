# Design: 電話查詢訂單

## 架構總覽

```
app/lib/orders.ts               ← findOrdersByPhone()：正規化比對 + JOIN 明細/取貨點（不快取）
app/api/orders/lookup/route.ts  ← POST：格式驗證 → 400；成功 → 200 { orders }
components/OrderLookup.tsx      ← 查詢區塊：電話輸入 + 結果列表（內部捲動）
components/App.tsx              ← 掛入點：<CheckoutForm/> 之後、<footer> 之前
components/Navbar.tsx           ← 「查詢訂單」入口（桌面 + 手機選單）
```

資料流與現有模式一致：DB → server 資料層 → API route → client fetch。差別在訂單查詢**必須即時**，不像 products/categories 走 `unstable_cache`。

## 1. 資料層（`app/lib/orders.ts` 新增 `findOrdersByPhone`）

```ts
export async function findOrdersByPhone(rawPhone: string): Promise<LookupOrder[]>
```

- 入口先 `normalizePhone()` + `isValidTwMobile()`，無效直接回傳錯誤（由 route 轉 400）。
- **比對兩邊都正規化**：既有資料寫入時只 trim，可能存有空白／連字號格式，因此 SQL 用
  `WHERE regexp_replace(phone, '[\s-]', '', 'g') = ${normalized}`。
- 回傳**全部**符合的訂單，`ORDER BY created_at DESC`；每筆 JOIN `order_items`（品項快照）與 `pickup_spots`（取貨點 city/township），組成 client 可直接渲染的形狀。
- 回應型別 `LookupOrder` 放 `types.ts`（root），欄位：`pickupNumber`、`customerName`、`deliveryMethod`、`location`（自取＝縣市＋地點；宅配＝地址）、`items[]`（`name`/`quantity`/`subtotal`）、`total`、`note`、`createdAt`。id 照慣例 DB 整數 → 字串。

### 寫入端順手修正

`createOrder` 儲存電話改為 `normalizePhone(phone)`——新資料從此乾淨統一；舊資料不 backfill，查詢端的正規化比對已涵蓋。

## 2. API（`POST /api/orders/lookup`）

比照 `POST /api/orders` 的手寫模式（不用 `jsonHandler`，因需區分 400/500）：

| 情境 | 回應 |
|------|------|
| body 非物件或 `phone` 非台灣手機格式 | 400 `{ error: "請輸入有效的台灣手機號碼" }` |
| 查詢成功（含 0 筆） | 200 `{ orders: LookupOrder[] }`（0 筆＝空陣列，讓前端呈現空狀態而非錯誤） |
| DB 例外 | 500（try/catch） |

用 POST 而非 GET query string：電話不進 URL／存取 log，也天然避開任何 GET 快取。

## 3. UI（`components/OrderLookup.tsx`）

### 位置與外觀

- `App.tsx` 內 `<CheckoutForm/>` 之後、footer 之前掛入，`id="order-lookup"`。
- 區塊用**白底**（`bg-white`）與結帳區的 `#f0f3ff` 交錯出區隔；內容為 `max-w-2xl` 白色圓角卡片（`rounded-2xl border border-[#dee8ff] shadow-md`），標題列 Search 圖示＋「查詢訂單」，完全複用結帳卡片的標題樣式。

### 查詢表單

- 單一電話輸入框＋「查詢」按鈕：輸入框沿用 `bg-[#f9f9ff] border-[#cfdaf1]` 樣式，按鈕沿用 `bg-[#00102d] hover:bg-[#0050cc]`。
- 送出前先以 `isValidTwMobile` 驗證，錯誤訊息沿用紅字樣式（`text-[#ba1a1a]`）。
- 查詢中按鈕 disabled 並顯示「查詢中...」（比照送出訂單按鈕的 submitting 處理）。

### 結果列表（內部捲動）

- 外層容器固定最大高度＋內部捲動（如 `max-h-96 overflow-y-auto`），**頁面不隨訂單數變長**——比照結帳卡品項列表 `max-h-40 overflow-y-auto` 的既有手法。
- 每筆訂單一張小卡，欄位主次：
  - **主要**：取貨編號（`#N`，卡片標題、最醒目）、訂購人姓名、品項明細（品名 × 數量 × 小計，沿用結帳卡品項列樣式）、總金額（`#0050cc` 粗體）。
  - **次要**（小一階、灰色 `#44474f`）：取貨方式與地點／宅配地址、下單時間、備註。
  - 完整顯示、不遮罩（需求方確認）。電話為查詢者自行輸入，不重複顯示。
- 查無資料：與商品區 `StatusPanel` 同精神的置中狀態文字「查無此電話的訂單」。
- API 失敗：紅底警示列（沿用 `bg-[#ffdad6] text-[#ba1a1a]` 樣式）。

## 4. Navbar 入口

- 桌面：分類連結列尾端加「查詢訂單」按鈕，樣式同分類連結（無 active 狀態——它不是分類）。
- 手機選單：同樣加一項，點擊後關閉選單。
- 兩者皆 `scrollIntoView({ behavior: "smooth" })` 至 `#order-lookup`，沿用既有 `handleNavClick` 的捲動手法。

## 5. 成立訂單彈窗：取貨地區 LINE 社群區塊

- **位置**：`OrderSuccessModal` 可捲動內容區的最後一段——視覺上緊貼「確認並返回首頁」按鈕上方。放捲動區內（而非按鈕所在的固定 footer），避免 7 個連結在手機上把內容區壓扁。
- **資料**：7 個地區社群以模組層級常數陣列存在元件檔內（比照 `App.tsx` 的 `TRUST_BADGES` 慣例），欄位 `region`（顯示用地區名）與 `url`（LINE 邀請連結）。
- **外觀**：沿用彈窗既有的 LINE 綠色系（宅配客服卡的 `#f0fdf4`／`#bbf7d0`／`#166534`）：綠底卡片＋標題「加入取貨地區 LINE 社群」，內為兩欄格線的地區按鈕（白底綠字、hover 轉 `#06C755` 實色），`target="_blank" rel="noopener noreferrer"` 開新分頁。
- **不做自動對應**：社群地區劃分與 `pickup_spots` 縣市鄉鎮無法一對一對映（南投縣同時對到「埔里/南投」與「竹山/…」）、宅配訂單無取貨地區，一律顯示全部 7 區由顧客自行點選。
- **兩種取貨方式皆顯示**。

## 6. 錯誤處理

| 情境 | 行為 |
|------|------|
| 電話格式錯誤（前端） | 表單紅字提示，不發請求 |
| 電話格式錯誤（繞過前端直打 API） | 400 `{ error }` |
| 查無訂單 | 200 空陣列 → 前端空狀態文字 |
| DB 帶連字號的舊電話資料 | SQL 正規化比對照樣命中 |
| API 5xx／網路錯誤 | 前端紅底警示列，可重試 |

## 7. 測試（Playwright e2e）

依既有 e2e 慣例：真實 dev server + `.env.local` 測試庫（查詢前先真實下單產生資料）。**前置相依**：Playwright 基礎建設尚未進 main，需等 `pwa-install-prompt` 分支合併或先帶進本分支。

新增 `e2e/order-lookup.spec.ts`：

1. **查得到**：以隨機測試電話真實宅配下單 → 於查詢區輸入同一電話 → 驗證結果出現該筆的取貨編號、姓名、品項、總金額。
2. **帶連字號也查得到**：下單用 `0912-XXX-XXX` 格式 → 用純數字查 → 命中（驗證正規化比對）。
3. **查無資料**：輸入未下過單的有效電話 → 顯示「查無此電話的訂單」。
4. **格式驗證**：輸入非手機格式 → 前端紅字、不發請求。

新增 `e2e/order-success-line-groups.spec.ts`：

1. **社群區塊呈現**：真實宅配下單 → 成功彈窗內、「確認並返回首頁」按鈕上方出現社群區塊，7 個地區連結齊全、href 正確、皆開新分頁。
