# Tasks: refine-typography-semantics

## 1. Token 與規範基礎

- [x] 1.1 `app/globals.css` @theme 新增 7 個 token：success `#1e7a46`、success-container `#d7f0e0`、on-success-container `#0a4326`、warning `#9a6200`、warning-container `#ffefd0`、on-warning-container `#5c3a00`、promo-bright `#d96a2b`（實測白字對比 ≥ 4.5:1，不足則調深並同步文件）
- [x] 1.2 `DESIGN.md` 回寫：新 token 加入調色盤、promo 語意改為「促銷信號＋加入購物車行動色」、Typography 段加入「font-black 禁用、最小字級 text-xs」規則

## 2. 字重與字級收斂（28 處 font-black、17 處小字）

- [x] 2.1 App.tsx（6 處 font-black：section h2/分類 tab/版切鈕/信賴徽章/footer/cart-bar h4 → bold 或 semibold；footer `text-[11px]` → text-xs）
- [x] 2.2 OrderSuccessModal.tsx（8 處 font-black、13 處小字：標題/號碼牌/LINE 框/明細/運費/社群標籤全面收斂）
- [x] 2.3 其餘元件（Navbar 品牌與徽章、CheckoutForm 3 處、OrderLookup 3 處、ProductCard 3 處、LineFloatButton、PwaInstallPrompt；含 Navbar `text-[10px]`、ProductCard `text-[11px]`×2。Hero h1 為唯一例外保留 font-black）
- [x] 2.4 全域 grep 確認 `font-black` 僅剩 Hero h1 一處、`text-\[(9|10|11)px\]` 歸零

## 3. 語意色替換（16 處）

- [x] 3.1 OrderSuccessModal.tsx：amber 取貨框 → warning 系、green LINE 框與社群框 → success 系、emerald 成功勾勾 → success、運費 `text-amber-600` → `text-warning`
- [x] 3.2 CheckoutForm.tsx:281 TriangleAlert `text-amber-600` → `text-warning`；grep 確認 amber/green/emerald 歸零

## 4. 按鈕與卡片

- [x] 4.1 主按鈕統一藍系：CheckoutForm 送出鈕（:310、:665）、OrderLookup 查詢鈕（:108）、OrderSuccessModal 主鈕（:280）改 `bg-secondary hover:bg-secondary-bright`
- [x] 4.2 ProductCard 加購鈕 `bg-secondary` → `bg-promo hover:bg-promo-bright`
- [x] 4.3 商品卡白灰交錯：卡片根元素加 `odd:bg-white even:bg-surface-container-low`（配合 App.tsx 網格）
- [x] 4.4 ProductCard 移除「會員價」前綴（:227）

## 5. Hero 與驗證

- [x] 5.1 Hero.tsx:13 高度改 `h-[70svh] min-h-[420px] sm:h-[85vh] sm:min-h-[500px]`
- [x] 5.2 `npm run check` 通過
- [ ] 5.3 dev server 目視驗收：字重層次、語意色兩種彈窗變體、加購鈕橘/其餘藍、白灰交錯（1/2/3/4 欄）、手機 Hero、徽章不破版
