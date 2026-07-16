## Why

首頁互動有五個磨擦點：結帳摘要不能調數量（要捲回商品區）、載入中只有一行字（無版面預期）、多圖輪播手機不能滑、彈窗鍵盤焦點會跑到背景（可近性缺陷）、分類 tab 可捲動但無視覺提示。

## What Changes

- 結帳區購物車摘要每列加 −/＋ stepper：重用 `app/domain/cart.ts` `changeCartQuantity`（歸零即移除、庫存 cap 由 `hydrateCart` 既有邏輯繼承），App 傳新的 `onChangeQuantity` handler 給 CheckoutForm。
- 商品載入中狀態改為 8 張與真卡片同版式的 skeleton 佔位卡（`animate-pulse`，`motion-reduce:animate-none`）。
- 卡片輪播與 lightbox 加觸控滑動（touchstart/touchend 位移門檻觸發既有 prev/next），共用 `app/lib/` 小 helper；不做拖曳跟手。
- 四個彈窗（ProductCard lightbox、OrderSuccessModal、CheckoutForm 確認彈窗、PwaInstallPrompt 教學）加共用 `useFocusTrap` hook：焦點圈限、開啟時聚焦、關閉時歸還焦點。
- 分類 tab 可捲動時右緣加 CSS mask 漸層淡出提示（手機限定、零 JS；捲到底淡出仍在為接受之 ceiling）。
- 零新依賴；domain 層零改動。

## Capabilities

### New Capabilities

- `shop-interactions`: 購物互動體驗——結帳摘要數量調整、載入 skeleton、輪播觸控、彈窗焦點圈限、分類捲動提示。

### Modified Capabilities

（無——既有 specs 的 requirements 不變。）

## Impact

- `components/App.tsx`（skeleton、onChangeQuantity、分類 tab mask）、`CheckoutForm.tsx`（摘要 stepper、確認彈窗 focus trap）、`ProductCard.tsx`（swipe、lightbox focus trap）、`OrderSuccessModal.tsx`、`PwaInstallPrompt.tsx`（focus trap）。
- 新檔：`app/lib/useFocusTrap.ts`、`app/lib/swipe.ts`（含測試）。
- 無 API、資料層、依賴、e2e 影響。
- 設計依據：brainstorming 設計文件 Change 2 段（2026-07-15，已與使用者確認）。
