## Context

延續 refine-typography-semantics 的首頁優化第二波：純互動層，五個獨立小項。實作落點已盤點：CheckoutForm 目前只收 `cart`/`onRemoveItem`/`onSubmitOrder`；卡片輪播 prev/next 為行內 setState、lightbox 有 `stepZoomedImage(delta)`；Esc/scroll-lock 已存在於 ProductCard 與 PwaInstallPrompt，OrderSuccessModal 與 CheckoutForm 確認彈窗沒有；分類 tab 在 `categories.length > 4` 時橫向捲動。

## Goals / Non-Goals

**Goals:** 結帳內直接調數量；載入有版面預期；手機滑圖；鍵盤/讀屏使用者焦點不逃逸；捲動可發現。

**Non-Goals:** 拖曳跟手動畫（需手勢庫）、原生 `<dialog>` 重構（與 motion 動畫衝突）、分類捲動精準顯隱（需 scroll listener）、domain 層改動。

## Decisions

1. **數量調整走 `onChangeQuantity(productId, delta)` 單一 prop**（App 內包 `changeCartQuantity`），不傳 add/removeOne 兩個——CheckoutForm 只需要 delta 語意；歸零即移除與庫存 cap 是 domain 既有行為，零新邏輯。＋鈕在 `stock !== null && quantity >= stock` 時停用，與 ProductCard stepper 同規則。
2. **swipe 用純函式 helper**（`app/lib/swipe.ts`：記錄 startX、endX，`|Δ| ≥ 40px` 回傳方向），元件各自綁 onTouchStart/onTouchEnd——比 hook 更少 API 面積，且可直接單元測試。
3. **`useFocusTrap(ref, active)` hook**：active 時聚焦容器內第一個 focusable、攔 Tab/Shift+Tab 循環、cleanup 時把焦點還給開啟前的 activeElement。不處理 Esc（各彈窗已有或由本 change 一併補上——OrderSuccessModal 與 CheckoutForm 確認彈窗補 Esc 關閉）。
4. **skeleton 佔位卡與真卡片同結構比例**（正方形圖塊＋文字條），直接用現有 gridClass 排版，數量固定 8。
5. **分類捲動提示用 CSS mask-image 漸層**，只在 isScrollable 分支加 class，`sm:` 以上不套。

## Risks / Trade-offs

- [focus trap 攔 Tab 與 motion 動畫掛載時序] → hook 在 effect 內查 focusable，掛載後才聚焦；AnimatePresence exit 期間 active=false 即解除。
- [swipe 與圖片點擊（開 lightbox）衝突] → 只在位移達門檻時觸發換圖，未達門檻不 preventDefault，點擊行為不變。
- [捲到底仍顯示淡出] → 已接受的 ceiling，換零 JS；需要再升級 scroll listener。

## Migration Plan

單一 PR，無部署複雜度。

## Open Questions

（無）
