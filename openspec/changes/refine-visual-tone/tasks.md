# Tasks: refine-visual-tone

## 1. 色彩 token 基礎

- [ ] 1.1 在 `app/globals.css` 以 `@theme` 定義 11 個色彩 token（surface / surface-container-low / surface-container / surface-container-high / surface-dim / on-surface / on-surface-variant / primary / secondary / secondary-bright / promo=#c2571b）
- [ ] 1.2 `DESIGN.md` 調色盤回寫 `promo` 色並註明用途（促銷徽章/lightbox 強調）

## 2. 商品區淺色化（App.tsx）

- [ ] 2.1 精選商品 section：`#02050c` 底改 `surface`，移除格線紋理 overlay，標題/副標改深色 token
- [ ] 2.2 分類 tab 與版面切換器容器改白底淺色 pill（active 維持 secondary 藍底白字，inactive 用 on-surface-variant）
- [ ] 2.3 StatusPanel 改白卡＋淺邊框；購物車浮動條改白底卡＋柔和陰影（0 4px 20px rgba(10,37,78,0.05)），移除發光陰影
- [ ] 2.4 App.tsx 其餘硬編碼色（footer、信賴徽章區、selection 色）改引用 token

## 3. 商品卡片（ProductCard.tsx）

- [ ] 3.1 圖片 `aspect-[3/4]` → `aspect-square`
- [ ] 3.2 字級層次：品名 semibold、描述 `text-sm` + `line-clamp-2`、刪「會員價」獨立小標改同行小字前綴、價格 `text-xl` 唯一粗體
- [ ] 3.3 CTA 橘改 secondary 藍（hover secondary-bright）；促銷徽章、lightbox 強調（hover/縮圖框/spinner）改 `promo`
- [ ] 3.4 hover 收斂：移除 shimmer 漸層、品名變色、邊框變色，保留圖片 scale 與陰影加深；卡片其餘硬編碼色與 slate-* 改 token

## 4. 其他元件色彩對齊

- [ ] 4.1 Hero.tsx、Navbar.tsx：高飽和 `#0266ff` 用法、發光陰影、硬編碼 hex 對齊 token（動畫與結構不動）
- [ ] 4.2 CheckoutForm.tsx、OrderLookup.tsx、OrderSuccessModal.tsx：掃描並對齊 `#ef6c00`/發光陰影/硬編碼 hex（僅色彩，不改結構）

## 5. 驗證

- [ ] 5.1 `npm run check` 與 `npm run build` 全數通過
- [ ] 5.2 起 dev server 目視驗收：商品區淺色、卡片層次與 2 行截斷、促銷徽章 promo 橘、lightbox、全頁無深色殘留與對比不足
