# Design: 訂購資料記憶自動帶入

## 架構總覽

```
app/lib/order-info-storage.ts   ← client-safe 儲存模組：localStorage 讀寫 + 形狀驗證
components/CheckoutForm.tsx     ← 接入點：mount 帶入 / 成功後儲存 / 下架地點檢查
```

資料流：純前端、無後端變更。localStorage key 為 **`cc_fresh_order_info`**，與購物車的 `cc_fresh_cart` 並存、互不相干。

## 1. 儲存模組（`app/lib/order-info-storage.ts`）

比照 `promotions.ts` / `validation.ts` 慣例：**client + server 皆可 import，不含 server-only 相依**（實際只在 client 呼叫）。

```ts
export type SavedOrderInfo = Omit<OrderFormData, "location">;
// name / phone / deliveryMethod / city / township / address / remarks
// location 是送出時才組出的顯示字串，不儲存

export function saveOrderInfo(data: SavedOrderInfo): void
  // JSON.stringify 後寫入 localStorage["cc_fresh_order_info"]

export function loadSavedOrderInfo(): SavedOrderInfo | null
  // 讀取 + 形狀驗證：七欄皆須為 string，deliveryMethod 須為 "pickup" | "delivery"
  // JSON 解析失敗或形狀不符 → 回傳 null 並 removeItem（自我修復壞資料）
```

所有 localStorage 存取包 try/catch（無痕模式、Safari 隱私設定下可能直接 throw），失敗一律靜默略過——記憶功能失效不得影響下單流程。

## 2. CheckoutForm 接入點

1. **讀（帶入）**：mount 後以 `useEffect` 呼叫 `loadSavedOrderInfo()`，有資料就整份 `setFormData` 蓋上。用 effect 而非 `useState` lazy initializer，避免 SSR/hydration 不一致（server 端無 localStorage）。
2. **寫（儲存）**：`handleSubmit` 中 `res.ok` 之後、呼叫 `onSubmitOrder` 之前，`saveOrderInfo(formData)`。只有成功下單才存。

## 3. 邊界：已下架的取貨地點

取貨點清單（`/api/pickup-spots`）為非同步載入，因此在 spots 首次載入完成後以 `useEffect` 檢查一次目前表單值：

- `city` 不在最新縣市清單 → 清空 `city` 與 `township`
- `city` 有效但 `township` 不在該縣市的地點清單 → 只清空 `township`
- 其餘欄位（姓名、電話等）照留

使用者會看到地點欄回到「請選擇」，送出時的既有 validation 照常擋下未選地點。此設計與購物車「對帳丟掉下架商品」的精神一致。

## 4. 互動視覺規格

本功能**不新增任何 UI 元素**（無提示列、無清除按鈕），只改變既有表單欄位的初始值：

- **帶入呈現**：欄位直接以預填值渲染，使用既有 input/select/textarea 樣式，無高亮、無動畫、無 toast。取貨方式按鈕依帶入的 `deliveryMethod` 呈現既有的 active 樣式（`bg-[#00102d]` 深底白字）。
- **帶入時機**：mount 後的 effect 填入。首屏（SSR/首次 render）為空白值，帶入發生在 hydration 後極短時間內，正常情況下使用者無感；不做 skeleton 或 loading 狀態。
- **下架地點清空**：欄位回到既有的空狀態（select 顯示「請選擇縣市」/「請選擇地點」placeholder option），無額外提示文案——與使用者第一次來的畫面相同。
- **備註字數計數**：帶入備註後，既有的 `{remarks.length}/100` 計數即時反映帶入內容長度（現有綁定自然成立，不需額外處理）。

## 5. 錯誤處理

| 情境 | 行為 |
|------|------|
| localStorage 不可用（無痕 / 隱私設定） | 靜默略過，表單行為與現況相同 |
| 存的資料非合法 JSON | 回傳 null、移除該 key，表單空白起始 |
| 存的資料形狀不符（舊版格式等） | 同上 |
| 存的取貨地點已下架 | 只清空地點欄位，其餘照帶 |
| 下單失敗（4xx/5xx） | 不寫入，既有資料保留 |

## 6. 測試（Playwright e2e）

依既有 e2e 慣例：真實 dev server + `.env.local` 測試庫（會寫入真實訂單），下單一律用宅配（不依賴 `pickup_spots` 資料）；`beforeEach` 清 `cc_fresh_order_info`（比照既有測試清 `cc_fresh_cart`）。

新增 `e2e/order-info-autofill.spec.ts`：

1. **下單成功後自動帶入**：真實宅配下單（姓名／電話／地址／備註）→ 成功彈窗 → reload → 驗證姓名、電話、取貨方式（宅配）、地址、備註皆已預填。
2. **下架取貨地點被清空**：`addInitScript` 直接 seed `cc_fresh_order_info`（`deliveryMethod: "pickup"`、不存在的 city/township、有效姓名電話）→ 開頁 → 姓名電話已帶入、縣市與地點選單回到「請選擇」。
3. **壞資料不影響頁面**：seed 非 JSON 字串 → 開頁 → 頁面正常、表單為空白初始值。
