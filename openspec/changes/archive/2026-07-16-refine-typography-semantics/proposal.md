## Why

PR #8 收斂了色彩 token 但留下三個未竟事項：字重氾濫（`font-black` 28 處、10px 以下小字 13 處）、成功/警示狀態仍硬編碼 amber/green（約 16 處，未 token 化）、主按鈕配色不一致（結帳/查訂單用 `bg-primary`，與 DESIGN.md「Secondary = CTA」規範相違）。同時業主提出兩項視覺需求：加入購物車鈕改促銷橘、商品卡白灰交錯。

## What Changes

- 字重收斂：`font-black` 全站禁用——大標題 `font-bold`、小標/強調 `font-semibold`；商品卡價格維持唯一 bold。規則回寫 `DESIGN.md`。
- 字級下限：最小 `text-xs`（12px）；`text-[9px]`/`text-[10px]`/`text-[11px]` 全數升級。
- 新增 6 個語意色 token（success / success-container / on-success-container / warning / warning-container / on-warning-container），替換 OrderSuccessModal 與 CheckoutForm 的硬編碼 amber/green/emerald；`DESIGN.md` 調色盤回寫。
- 主按鈕統一藍系：CheckoutForm 送出鈕、OrderLookup 查詢鈕、OrderSuccessModal 主鈕改 `bg-secondary hover:bg-secondary-bright`。
- 加入購物車鈕改促銷橘（業主需求）：`bg-promo` + 新 token `promo-bright`（hover）；促銷橘語意擴為「促銷信號＋加購行動」。
- 商品卡白灰交錯（業主需求）：奇數卡白、偶數卡 `surface-container-low`（`odd:`/`even:` 一行實作；偶數欄寬呈直條紋為已接受特性）。
- 手機版 Hero 高度縮減：`h-[70svh] min-h-[420px]`，`sm:` 以上維持現狀。
- 移除 ProductCard 價格前「會員價」前綴（站上無會員機制）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `visual-design-system`: 「強調色語意分工」requirement 修改——加入購物車鈕由品牌藍改為促銷橘（promo 語意擴大）；新增字重/字級收斂、success/warning 語意色、商品卡白灰交錯之 requirements。

## Impact

- `app/globals.css`（+8 token）、`DESIGN.md`（調色盤與 Typography 規則回寫）。
- `components/`：App、ProductCard、Hero、Navbar、CheckoutForm、OrderLookup、OrderSuccessModal、LineFloatButton、PwaInstallPrompt（純 class 層級，無邏輯變更）。
- 無 API、資料層、依賴、e2e 影響。
- 設計文件：`docs/superpowers/specs/2026-07-15-homepage-polish-design.md`（Change 1 段，已確認）。
