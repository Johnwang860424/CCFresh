## ADDED Requirements

### Requirement: 下單完成顯示加入桌面引導
系統 SHALL 在 iOS 或 Android 行動裝置（非 standalone 模式）完成下單後，於訂單成功彈窗（OrderSuccessModal）內容區「最上方」（成功橫幅之前）顯示引導區塊，文案為「CC 生鮮加入手機桌面，下次下單更快速！」並含「查看教學」按鈕。引導區塊 SHALL 每次下單完成都顯示（無「看過即隱藏」記憶）。

#### Scenario: iOS 裝置下單完成
- **WHEN** UA 為 iPhone/iPad/iPod 的裝置（非 standalone）完成下單、訂單成功彈窗開啟
- **THEN** 內容區最上方顯示引導區塊與「查看教學」按鈕

#### Scenario: Android 裝置下單完成
- **WHEN** UA 含 Android 的裝置（非 standalone）完成下單、訂單成功彈窗開啟
- **THEN** 內容區最上方顯示引導區塊與「查看教學」按鈕

#### Scenario: 同裝置重複下單
- **WHEN** 同一行動裝置再次完成下單
- **THEN** 引導區塊仍然顯示

### Requirement: 不適用情境隱藏引導
系統 SHALL NOT 在下列情境顯示引導區塊：桌機／無法辨識裝置、已於 standalone 模式（已加入桌面並從圖示開啟）、in-app 瀏覽器（LINE / Facebook / Instagram / Android WebView，這些環境沒有「加入主畫面」入口）。不顯示時 SHALL 無占位空間、無 layout shift。

#### Scenario: 桌機下單完成
- **WHEN** 桌機瀏覽器完成下單、訂單成功彈窗開啟
- **THEN** 引導區塊不存在，彈窗其餘內容（號碼牌／訂單明細）不受影響

#### Scenario: standalone 模式下單完成
- **WHEN** 行動裝置以 standalone 模式（`display-mode: standalone` 或 iOS `navigator.standalone`）完成下單
- **THEN** 引導區塊不存在

#### Scenario: in-app 瀏覽器下單完成
- **WHEN** 顧客在 LINE 等 in-app 瀏覽器（UA 含 ` Line/`、`FBAN`、`FBAV`、`Instagram` 或 `; wv)`）完成下單
- **THEN** 引導區塊不存在

### Requirement: 依裝置顯示教學圖
點擊「查看教學」後，系統 SHALL 以全螢幕 lightbox 顯示對應裝置的教學圖：iOS 顯示 `/pwa/IOS_0.jpg`（iPhone Safari 教學）、Android 顯示 `/pwa/Android_0.jpg`（Android Chrome 教學）。lightbox 層級 SHALL 高於訂單成功彈窗（z-[60] > z-50）且教學圖完整可見（object-contain 不裁切）。

#### Scenario: iOS 查看教學
- **WHEN** iOS 裝置點擊「查看教學」
- **THEN** lightbox 顯示 `/pwa/IOS_0.jpg`

#### Scenario: Android 查看教學
- **WHEN** Android 裝置點擊「查看教學」
- **THEN** lightbox 顯示 `/pwa/Android_0.jpg`

#### Scenario: 關閉教學
- **WHEN** lightbox 開啟後點擊右上角關閉鈕或背景遮罩
- **THEN** lightbox 關閉，回到訂單成功彈窗且原內容（號碼牌、明細）保持不變

### Requirement: 下單主流程不回歸
訂單成功彈窗原有內容與行為（取貨號碼牌／宅配 LINE 資訊、訂購明細、金額計算）SHALL 與現狀一致，不受引導區塊影響。

#### Scenario: 任何裝置完成下單
- **WHEN** 任何裝置完成下單、訂單成功彈窗開啟
- **THEN** 取貨號碼牌／宅配資訊、訂購明細、金額顯示與變更前一致
