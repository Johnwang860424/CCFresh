## Context

PR #8 完成色彩 token 化後的第二波視覺收斂。詳細背景與逐項決策見 `docs/superpowers/specs/2026-07-15-homepage-polish-design.md`（Change 1 段，已與使用者逐節確認）。實作落點已盤點：`font-black` 28 處（9 個元件）、10–11px 小字 17 處（集中在 OrderSuccessModal 13 處）、amber/green/emerald 16 處（OrderSuccessModal 15 處＋CheckoutForm 1 處）。

## Goals / Non-Goals

**Goals:**
- 字重/字級有規範且全站一致；語意色（成功/警示）token 化；按鈕配色語意明確（藍＝一般 CTA、橘＝加購）。
- 業主兩項需求落地：加購鈕促銷橘、商品卡白灰交錯。

**Non-Goals:**
- 不動任何邏輯、結構、動畫；不加依賴；互動類項目（skeleton、觸控、focus trap 等）屬 Change 2。

## Decisions

1. **語意色命名沿用 DESIGN.md 的 Material 式 error 模式**（`success`/`success-container`/`on-success-container`，warning 同構）而非自創命名——與既有 error token 對稱，未來要補 on-success 等也有規則可循。候選值 success `#1e7a46`、warning `#9a6200`（container/on-container 見設計文件），以白底對比 ≥ 4.5:1 驗證後定案。
2. **OrderSuccessModal 的 amber 取貨號碼框歸類為 warning-container**（提示性資訊框）、green LINE 框歸類 success-container——按語意而非按色相對映。運費金額的 `text-amber-600` 改 `text-warning`。
3. **加購鈕橘色僅限 ProductCard 的「加入購物車」**；stepper、浮動條、結帳送出維持藍系。`promo-bright` 定為 hover 亮階（約 `#d96a2b`），與 `secondary`/`secondary-bright` 的既有 hover 模式對稱。
4. **白灰交錯用 `odd:`/`even:` variant**，不寫 per-breakpoint nth-child——偶數欄呈直條紋是與使用者確認過的接受特性。
5. **Hero 用 `svh`** 而非 `vh` 做手機高度，避免行動瀏覽器網址列收合時跳動。
6. **spec 衝突處理**：已歸檔的 `visual-design-system` spec 要求「CTA 為品牌藍」，與加購鈕橘衝突——本 change 以 MODIFIED delta 更新該 requirement，spec 與程式碼同步修正，不留矛盾。

## Risks / Trade-offs

- [promo 橘 `#c2571b` 白字對比 ≈ 4.5:1，臨界值] → 實作時實測，不足則微調深一階（往 `#b34f18`），並同步回寫 DESIGN.md。
- [促銷徽章與加購鈕同色，「特價」視覺獨占性下降] → 已向使用者揭示並接受；徽章有位置與形狀差異可辨。
- [字級升為 text-xs 後個別 badge 變寬] → 預期內；目視驗收時檢查 Navbar 購物車數字徽章與促銷徽章不破版。

## Migration Plan

單一 PR，純樣式改動，無部署/回滾複雜度。回滾即 revert。

## Open Questions

（無——所有決策已在 brainstorming 與設計文件確認。）
