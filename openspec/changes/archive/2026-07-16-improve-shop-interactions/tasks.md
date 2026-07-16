# Tasks: improve-shop-interactions

## 1. 共用 helper

- [x] 1.1 `app/lib/swipe.ts`：純函式（startX/endX、門檻 40px → 'left'|'right'|null）＋ colocated `swipe.test.ts`
- [x] 1.2 `app/lib/useFocusTrap.ts`：聚焦進入、Tab 循環、關閉歸還焦點的 hook

## 2. 結帳摘要數量調整

- [x] 2.1 App.tsx 新增 `handleChangeQuantity(productId, delta)` 並傳給 CheckoutForm
- [x] 2.2 CheckoutForm 摘要列加 −/＋ stepper（沿用 ProductCard stepper 樣式；stock 上限停用＋）

## 3. Skeleton

- [x] 3.1 App.tsx 載入中分支改為 8 張佔位卡（同 gridClass、animate-pulse、motion-reduce）

## 4. 輪播觸控

- [x] 4.1 ProductCard 卡片輪播加 touch 滑動（多圖時）
- [x] 4.2 lightbox 大圖加 touch 滑動（接 `stepZoomedImage`）

## 5. 彈窗焦點圈限

- [x] 5.1 ProductCard lightbox 套 useFocusTrap
- [x] 5.2 OrderSuccessModal 套 useFocusTrap＋補 Esc 關閉
- [x] 5.3 CheckoutForm 確認彈窗套 useFocusTrap＋補 Esc 關閉
- [x] 5.4 PwaInstallPrompt 教學彈窗套 useFocusTrap（Esc 已有）

## 6. 信賴徽章區（追加項）

- [x] 6.0 信賴徽章區改冷鏈履歷時間軸：旅程排序（透明→冷鏈→交貨）、每項補充句、虛線連接（手機直式/桌機橫式）、節標「產地到餐桌，全程低溫」

## 7. 分類捲動提示與驗證

- [x] 7.1 分類 tab isScrollable 分支加右緣 mask 漸層（sm: 取消）
- [x] 7.2 `npm run check` 通過
- [x] 7.3 dev server 驗收：結帳調數量（歸零/上限）、skeleton、手機模擬滑動換圖、四彈窗 Tab 循環與 Esc、分類淡出
