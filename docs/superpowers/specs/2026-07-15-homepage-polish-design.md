# 首頁樣式收斂與互動體驗優化 — 設計文件

日期：2026-07-15
狀態：已與使用者確認
來源：PR #8 merge 後留下的後續項目＋業主兩項新需求（加購鈕改促銷橘、商品卡白灰交錯）

切成兩個 OpenSpec change，分開實作、分開送 PR：

1. **`refine-typography-semantics`** — 樣式收斂（純 class/文案層級，不動邏輯、不加依賴）
2. **`improve-shop-interactions`** — 互動體驗（有邏輯、需要測試，零新依賴）

---

## Change 1：refine-typography-semantics（樣式收斂）

### 1.1 字重收斂

現況 `font-black` 28 處（9 個元件）。規則：**`font-black` 全站禁用**——大標題（Hero h1、section 標題）用 `font-bold`，小標題與強調用 `font-semibold`；商品卡價格維持「唯一 `font-bold text-xl`」的既有規範。規則回寫 `DESIGN.md` Typography 段。

### 1.2 字級下限

最小字級 `text-xs`（12px）。現有 `text-[10px]`（8 處）、`text-[9px]`（1 處）、footer `text-[11px]` 全部升為 `text-xs`。個別 badge 可能稍寬，屬預期。

### 1.3 success / warning 語意色 token

`DESIGN.md` 只有 error 系；沿用其命名模式新增 6 個 token（值以白底文字對比 ≥ 4.5:1 為準，實作時驗證）：

- `success: #1e7a46`、`success-container: #d7f0e0`、`on-success-container: #0a4326`
- `warning: #9a6200`、`warning-container: #ffefd0`、`on-warning-container: #5c3a00`

現有硬編碼 amber/green/emerald 約 20 處全部替換；`DESIGN.md` 調色盤回寫。

### 1.4 主按鈕統一（藍系）

依 `DESIGN.md` 既有規範：CTA 一律 `bg-secondary hover:bg-secondary-bright`。翻掉 CheckoutForm 送出鈕、OrderLookup 查詢鈕、OrderSuccessModal 主鈕目前的 `bg-primary hover:bg-secondary`。`bg-primary` 保留給 footer、overlay、深底容器。

### 1.5 加入購物車鈕改促銷橘（業主需求）

- 僅 ProductCard「加入購物車」鈕：`bg-secondary` → `bg-promo`，hover 用新增 token `promo-bright`（約 `#d96a2b`，白字對比鎖 ≥ 4.5:1）。
- stepper +/-、購物車浮動條、結帳送出、查訂單維持藍系。
- `DESIGN.md` promo 語意改寫為「促銷信號＋加入購物車行動色」。
- 已歸檔的 `visual-design-system` main spec 有「CTA 為品牌藍」requirement，與此需求衝突——本 change 以 **MODIFIED delta** 修正該 requirement（排除加入購物車鈕），spec 與程式不得矛盾。

### 1.6 商品卡白灰交錯（業主需求）

卡片背景奇偶交錯：奇數卡白（`#ffffff`）、偶數卡 `surface-container-low`。一行 `odd:`/`even:` variant 實作。**已知並接受的特性**：偶數欄寬呈直條紋、奇數欄呈棋盤格、list 檢視為斑馬紋，圖案隨裝置欄數改變。

### 1.7 手機版 Hero 高度＋會員價文案

- Hero：`h-[85vh] min-h-[500px]` → `h-[70svh] min-h-[420px] sm:h-[85vh] sm:min-h-[500px]`（svh 避開手機網址列跳動）。
- ProductCard 價格前的「會員價」前綴刪除（站上無會員機制，用詞誤導）。

### 影響檔案

`app/globals.css`（+8 token）、`DESIGN.md`、`components/`（App、ProductCard、Hero、Navbar、CheckoutForm、OrderLookup、OrderSuccessModal、LineFloatButton、PwaInstallPrompt 的 class 層級改動）、`openspec/specs/visual-design-system/`（MODIFIED delta）。

### 驗證

`npm run check`＋dev server 目視（字重層次、語意色、按鈕配色、白灰交錯三種檢視、手機 Hero、對比度抽查）。無新測試（純樣式）。

---

## Change 2：improve-shop-interactions（互動體驗）

### 2.1 結帳區購物車摘要調整數量

- CheckoutForm 已收 `cart` prop；App 再傳現有的數量調整 handler 下去（內部走 `app/domain/cart.ts` `changeQuantity`）。**不寫新邏輯，純接線**：歸零即移除、上限吃庫存 cap 都免費繼承。
- 摘要列每行加 −/＋ stepper，樣式沿用 ProductCard 現有 stepper。
- 購物車被減到空時維持現有空車錯誤提示行為。

### 2.2 商品載入 skeleton

載入中的 StatusPanel 換成 8 張與真卡片同版式的佔位卡（正方形圖塊＋兩行文字條＋價格條），純 div + `animate-pulse`（`motion-reduce:animate-none`）。錯誤/空狀態維持現有 StatusPanel。

### 2.3 輪播觸控滑動

卡片輪播與 lightbox 現況只有箭頭鈕。加 `onTouchStart`/`onTouchEnd` 記錄 clientX、位移超過約 40px 觸發現有 prev/next——約 15 行的共用 helper 放 `app/lib/`。不做拖曳跟手動畫（需手勢庫，YAGNI）。

### 2.4 彈窗焦點圈限（focus trap）

- 範圍：ProductCard lightbox、OrderSuccessModal、CheckoutForm 送單確認彈窗、PwaInstallPrompt。
- 做法：共用 `useFocusTrap` hook（約 25 行）——開啟時 focus 進彈窗、Tab/Shift+Tab 循環、關閉時 focus 還給觸發元素。Esc 沿用各彈窗現有處理。
- 不採原生 `<dialog showModal>`：四個彈窗都是 motion/react 動畫容器，重構風險大於一個小 hook。

### 2.5 分類捲動提示

分類 tab 列手機寬度下右緣加 `mask-image` 漸層淡出（`sm:` 以上取消），純 CSS 零 JS。**已知並接受的 ceiling**：捲到最底時淡出仍在；要精準顯隱再升級 scroll listener。

### 影響檔案

`components/App.tsx`、`CheckoutForm.tsx`、`ProductCard.tsx`、`PwaInstallPrompt.tsx`、`OrderSuccessModal.tsx`、`app/lib/`（swipe helper、useFocusTrap）。domain 層零改動。

### 驗證

- swipe helper 與 `useFocusTrap` 各配一個 vitest（純函式/DOM 行為）。
- `changeQuantity` 歸零/上限行為由既有 domain 測試涵蓋，不重複測。
- `npm run check`＋dev server 手動驗收（觸控用裝置模擬器）。

---

## 實作順序

Change 1 → Change 2。各自走完整流程：功能分支 → opsx:apply → /qa → PR → archive。

## 明確不做

- 不加任何新依賴（手勢庫、focus-trap 套件、skeleton 套件都不用）
- 不動 domain 層與 API
- 不做輪播拖曳跟手動畫
- 不改原生 `<dialog>`
- 分類捲動提示不做 scroll 精準顯隱
