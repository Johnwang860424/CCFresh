# 視覺去螢光感與商品卡片質感改善 — 設計文件

日期：2026-07-14
狀態：使用者已確認

## 背景

盤點發現整站「螢光感」來源：近黑底商品區（`#02050c`）配高飽和亮藍（`#0266ff`）與發光陰影、不在設計系統內的硬編碼橘色 `#ef6c00`、以及扁平的字級層次讓商品卡片擁擠且每張長相雷同。`DESIGN.md` 規範的是淺色「冰霜清爽」語言，程式碼卻是深淺兩套並存。

## 已確認的決策

1. **商品區改回淺色**，整站統一 DESIGN.md 的淺色語言（不保留深色 premium 區塊）。
2. **CTA 改品牌藍，橘色只留給促銷徽章**，且橘色降飽和後正式收進設計系統。
3. **純視覺調整，不動功能**：版面排列切換器保留、不新增庫存/狀態 chip、不動任何行為邏輯。
4. **所有動畫保留**（含 `animate-ping` / `animate-bounce` / `animate-pulse` 等常駐動畫），本次不收斂。

## 設計

### 1. 色彩 token（`app/globals.css`，Tailwind v4 `@theme`）

只定義實際會用到的變數（約 10 個），不搬 DESIGN.md 全部 50 色：

| token | 值 | 用途 |
|---|---|---|
| `--color-surface` | `#f9f9ff` | 商品區底、頁面底 |
| `--color-surface-container-low` | `#f0f3ff` | 圖片底、淺色填充 |
| `--color-surface-container` | `#e7eeff` | Navbar 底、tab 容器 |
| `--color-surface-container-high` | `#dee8ff` | 卡片邊框、hover 填充 |
| `--color-surface-dim` | `#cfdaf1` | 邊框 hover、分隔線 |
| `--color-on-surface` | `#111c2c` | 主要文字 |
| `--color-on-surface-variant` | `#44474f` | 次要文字 |
| `--color-primary` | `#00102d` | 深藍（標題、footer） |
| `--color-secondary` | `#0050cc` | CTA、價格、active 狀態 |
| `--color-secondary-bright` | `#0266ff` | hover 亮藍 |
| `--color-promo` | `#c2571b` | 促銷徽章、lightbox 強調（降飽和暖橘，取代 `#ef6c00`） |

元件內硬編碼 hex 與混用的 `slate-*` 改為引用 token（`bg-surface`、`text-on-surface` 等）。`--color-promo` 一併回寫進 `DESIGN.md` 調色盤。

### 2. 商品區改淺色（`components/App.tsx`）

- `#02050c` 黑底 → `surface` 淺底；移除格線紋理 overlay。
- 「精選商品」標題白字 → `primary` 深藍；副標 `#bebfe1` → `on-surface-variant`。
- 分類 tab 與版面切換器：深色容器（`slate-900/50`）→ 白底容器 + `surface-container-high` 邊框；active 維持 `secondary` 藍底白字，inactive 文字 `on-surface-variant`。
- `StatusPanel`（載入/錯誤/空分類）：深色框 → 白卡 + 淺邊框。
- 購物車浮動條：`slate-900/90` → 白底卡，陰影依 DESIGN.md Level 2（`0 4px 20px rgba(10,37,78,0.05)`），文字色對應翻轉。
- 發光陰影（`shadow-[#0050cc]/25` 類）全部移除，改一般柔和陰影。

### 3. 商品卡片（`components/ProductCard.tsx`）

**版式**
- 圖片 `aspect-[3/4]` → `aspect-square`，降低卡片高度、放大文字區占比。
- 描述 `text-xs` → `text-sm` + `line-clamp-2`，卡片高度一致。
- 刪 10px 大寫「會員價」獨立標籤，改為與價格同行的小字前綴。

**字級層次**
- 品名：`font-bold` → `font-semibold`，維持 16px。
- 價格：`text-lg` → `text-xl`，卡上唯一 `font-bold`/`font-black` 層級，色用 `secondary`。
- 其餘文字不加粗，重量/描述用 `on-surface-variant`。

**色彩**
- 「加入購物車」按鈕：橘 → `secondary` 藍（hover `secondary-bright`）。
- 促銷徽章、lightbox 的按鈕 hover 與縮圖選中框、spinner：`#ef6c00` → `promo`。
- 售完狀態樣式維持現狀（已是低飽和）。

**hover 收斂**
- 保留：圖片 `scale-105`、卡片陰影加深。
- 移除：冰霜 shimmer 漸層、品名變色、邊框變色。
- （放大鏡 overlay、輪播箭頭顯示等功能性 hover 不動。）

### 4. 其他元件對齊

- `Hero.tsx`、`Navbar.tsx`、`CheckoutForm.tsx`、`OrderLookup.tsx`、`OrderSuccessModal.tsx`：僅將引用到的 `#0266ff` 高飽和用法、發光陰影與 `#ef6c00` 對齊到 token，不改結構、不改動畫。

### 5. 明確不做

- 不刪版面排列切換器。
- 不加庫存/狀態 chip。
- 不動任何常駐動畫。
- 不動購物車、訂單、promotions 等邏輯。
- 不引入新依賴。

## 驗證

- `npm run check`（lint + typecheck + unit tests）。
- `npm run build`（改到 globals.css 與多個 client 元件）。
- 起 dev server 目視確認：商品區淺色、卡片層次、促銷徽章、lightbox、深淺色殘留。

## 錯誤處理 / 風險

- 純樣式改動，無新錯誤路徑。主要風險是深色區改淺色後個別文字對比不足——逐一目視檢查文字/背景組合（皆取自 DESIGN.md 既有配對，對比已驗證過）。
- e2e 不依賴顏色 class，不受影響。
