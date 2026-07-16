## ADDED Requirements

### Requirement: 結帳摘要可調整數量
結帳區購物車摘要每列 SHALL 提供 −/＋ 數量調整，行為 SHALL 與商品卡 stepper 一致：減到 0 即從購物車移除該列；有限庫存商品在數量達剩餘庫存時「＋」停用。

#### Scenario: 減到 0 移除
- **WHEN** 摘要列數量為 1 且按下 −
- **THEN** 該商品從購物車與摘要消失；購物車清空時顯示既有的空車提示

#### Scenario: 庫存上限
- **WHEN** 商品剩餘庫存為 N 且摘要列數量已達 N
- **THEN** 該列「＋」為停用狀態

### Requirement: 商品載入 skeleton
商品列表載入中 SHALL 顯示與商品卡同版式的 skeleton 佔位卡（`animate-pulse`，遵守 `motion-reduce`），而非純文字狀態框；錯誤與空分類狀態維持文字狀態框。

#### Scenario: 載入中
- **WHEN** `/api/products` 尚未回應
- **THEN** 商品網格位置顯示 8 張灰色佔位卡，版面欄數與目前選擇一致

### Requirement: 輪播觸控滑動
商品卡多圖輪播與 lightbox SHALL 支援觸控滑動切換（水平位移達門檻觸發前/後一張），且不影響既有的點擊開圖與箭頭按鈕行為。

#### Scenario: 卡片滑動換圖
- **WHEN** 在多圖商品卡圖片上向左滑動超過門檻
- **THEN** 顯示下一張圖；向右滑動則顯示上一張

#### Scenario: 未達門檻
- **WHEN** 觸控位移小於門檻（點擊）
- **THEN** 不換圖，維持原點擊行為（開啟 lightbox）

### Requirement: 彈窗焦點圈限
ProductCard lightbox、OrderSuccessModal、CheckoutForm 送單確認彈窗與 PwaInstallPrompt 教學彈窗 SHALL 圈限鍵盤焦點：開啟時焦點進入彈窗，Tab/Shift+Tab 在彈窗內循環，關閉時焦點回到開啟前的元素；四個彈窗皆 SHALL 支援 Esc 關閉。

#### Scenario: Tab 循環
- **WHEN** 彈窗開啟且焦點在彈窗內最後一個可聚焦元素按 Tab
- **THEN** 焦點回到彈窗內第一個可聚焦元素，不逃逸到背景頁面

#### Scenario: 關閉歸還焦點
- **WHEN** 彈窗關閉
- **THEN** 焦點回到開啟彈窗前的觸發元素

### Requirement: 分類捲動提示
分類 tab 列於可橫向捲動時（手機寬度）SHALL 在右緣顯示漸層淡出提示尚有內容；`sm` 斷點以上不顯示。

#### Scenario: 手機多分類
- **WHEN** 分類數超過一列可容納且視窗為手機寬度
- **THEN** tab 列右緣呈漸層淡出
