# Proposal: refine-visual-tone

## Why

整站有明顯「螢光感」且商品卡片可讀性差：近黑底商品區配高飽和亮藍與發光陰影、不在 `DESIGN.md` 調色盤內的硬編碼橘色 `#ef6c00`、扁平的字級層次（幾乎全 bold/black）讓卡片擁擠且每張長相雷同。程式碼同時混用硬編碼 hex 與 Tailwind `slate-*` 兩套色彩，與 `DESIGN.md` 規範的淺色「冰霜清爽」語言脫節。

## What Changes

- 在 `app/globals.css` 以 Tailwind v4 `@theme` 定義約 11 個實際使用的色彩 token（取自 `DESIGN.md`，新增降飽和促銷橘 `promo`），元件改引用 token，淘汰硬編碼 hex 與 `slate-*` 混用。
- 商品區（精選商品 section）由近黑底改為淺色（`surface`），移除格線紋理與發光陰影；分類 tab、版面切換器、狀態框、購物車浮動條同步改淺色。
- 商品卡片：圖片改 1:1、描述 `text-sm` + `line-clamp-2`、刪獨立「會員價」小標、字重收斂（品名 semibold、價格為唯一 bold 且放大）、CTA 由橘改品牌藍、hover 效果收斂為圖片縮放＋陰影。
- 促銷徽章與 lightbox 強調色由 `#ef6c00` 改為降飽和 `promo` 橘；`DESIGN.md` 調色盤回寫 `promo`。
- 其他元件（Hero、Navbar、CheckoutForm、OrderLookup、OrderSuccessModal）僅對齊色彩 token，不改結構。
- 明確不做：不刪版面切換器、不加庫存 chip、**不動任何動畫**、不動業務邏輯、不加依賴。

## Capabilities

### New Capabilities

- `visual-design-system`: 整站色彩 token 化與淺色視覺語言——商品區淺色呈現、商品卡片資訊層次、強調色語意分工（品牌藍 = CTA/互動、promo 橘 = 促銷）。

### Modified Capabilities

（無——現有 specs 均為功能行為，本次為純視覺呈現變更，不影響任何既有 requirement。）

## Impact

- `app/globals.css`（新增 @theme token）、`DESIGN.md`（回寫 promo 色）。
- `components/App.tsx`、`ProductCard.tsx`、`Hero.tsx`、`Navbar.tsx`、`CheckoutForm.tsx`、`OrderLookup.tsx`、`OrderSuccessModal.tsx`（class 層級改動，無邏輯變更）。
- 無 API、資料層、依賴或 e2e 影響（e2e 不依賴顏色 class）。
- 設計文件：`docs/superpowers/specs/2026-07-14-visual-tone-refresh-design.md`（已確認）。
