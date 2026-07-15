# Design: refine-visual-tone

（完整脈絡見已確認的設計文件 `docs/superpowers/specs/2026-07-14-visual-tone-refresh-design.md`，此處摘要技術決策。）

## Context

商品區為近黑底（`#02050c`）配高飽和亮藍與發光陰影，與 `DESIGN.md` 的淺色冰霜語言相斥；卡片 CTA 用不在調色盤內的橘 `#ef6c00`；元件混用硬編碼 hex 與 `slate-*`。純前端樣式問題，無資料或行為變更。

## Goals / Non-Goals

**Goals:**
- 去除螢光感：商品區淺色化、移除發光陰影、強調色降飽和並語意分工。
- 商品卡片可讀性：1:1 圖、字重收斂、描述 line-clamp、hover 收斂。
- 色彩單一來源：`@theme` token，元件不再硬編碼。

**Non-Goals:**
- 不動任何動畫（含常駐 ping/pulse/bounce）。
- 不刪版面切換器、不加庫存 chip、不動業務邏輯、不加依賴、不做深色模式。

## Decisions

1. **Tailwind v4 `@theme` token 而非逐檔換 hex**：只定義實際用到的 ~11 個變數（非 DESIGN.md 全部 50 色），之後調色改一處。替代方案「最小 diff 直接換色」會把兩套色彩混用問題留著，被否決。
2. **促銷橘降飽和為 `#c2571b` 並收進 token（`promo`）**，同步回寫 `DESIGN.md`；CTA 改品牌藍。一個語意一個色：藍 = 互動/CTA，promo 橘 = 促銷。
3. **卡片圖片 `aspect-square`**：降低卡高、放大文字區占比；食品電商慣例 1:1。
4. **售完樣式維持現狀**：已是低飽和毛玻璃，不在螢光感範圍。
5. **e2e 不受影響**：Playwright 選擇器不依賴顏色 class，不需改 e2e。

## Risks / Trade-offs

- [深色改淺色後個別文字對比不足] → 色彩組合全部取自 DESIGN.md 既有配對；實作後起 dev server 逐區目視檢查。
- [token 命名與 Tailwind 內建色衝突]（如 `secondary`）→ Tailwind v4 `--color-*` 自訂命名空間不會與內建 palette 衝突，維持 DESIGN.md 命名。
