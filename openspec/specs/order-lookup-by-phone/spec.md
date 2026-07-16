## ADDED Requirements

### Requirement: 電話查詢訂單 API
系統 SHALL 提供 `POST /api/orders/lookup`（body `{ phone }`）：電話非有效台灣手機格式時回 400 `{ error }`；有效時以**正規化後的電話**（去除空白與連字號）比對 `orders.phone`（比對時兩邊皆正規化，涵蓋既有未正規化資料），回傳該電話**全部**訂單、依下單時間新到舊排序。查無資料 SHALL 回 200 空陣列。查詢 SHALL 為即時資料、不經任何快取層。每筆訂單 SHALL 額外包含編輯所需欄位：訂單電話（phone）、自取的縣市與鄉鎮（city/township）、宅配地址（address）、品項的 productId 與 unitPrice。

#### Scenario: 查得到訂單
- **WHEN** 顧客以曾下單的電話查詢
- **THEN** 回 200，orders 依 `created_at` 新到舊列出該電話全部訂單，每筆含取貨編號、姓名、電話、取貨方式與地點／地址（自取含 city/township、宅配含 address）、品項明細（productId、品名、單價、數量、小計）、總金額、下單時間、備註

#### Scenario: 舊資料帶連字號
- **WHEN** 資料庫存的電話為 `0912-345-678`，顧客以 `0912345678` 查詢
- **THEN** 該筆訂單照樣命中

#### Scenario: 查無訂單
- **WHEN** 顧客以未曾下單的有效手機號碼查詢
- **THEN** 回 200 與空陣列

#### Scenario: 格式錯誤
- **WHEN** 送出的 `phone` 非有效台灣手機格式
- **THEN** 回 400 `{ error }`

### Requirement: 訂單寫入儲存正規化電話
`createOrder` SHALL 以 `normalizePhone()` 後的純數字字串寫入 `orders.phone`。既有未正規化資料 SHALL NOT 需要 backfill（由查詢端比對涵蓋）。

#### Scenario: 帶連字號下單
- **WHEN** 顧客以 `0912-345-678` 完成下單
- **THEN** `orders.phone` 儲存為 `0912345678`

### Requirement: 查詢訂單區塊
系統 SHALL 在結帳區之後、footer 之前提供「查詢訂單」區塊（`id="order-lookup"`），沿用結帳卡片的設計語言。表單為單一電話輸入與查詢按鈕，送出前 SHALL 以既有共用驗證檢查手機格式。結果每筆 SHALL 以取貨編號、訂購人姓名、品項明細、總金額為主要資訊，取貨方式與地點／地址、下單時間、備註為次要資訊，完整顯示、不遮罩。結果列表 SHALL 以固定最大高度內部捲動呈現，頁面長度不隨訂單數增加。

#### Scenario: 查詢成功
- **WHEN** 顧客輸入有效電話並查詢、該電話有訂單
- **THEN** 區塊內列出訂單卡片（可於列表內捲動），每筆呈現取貨編號、姓名、品項×數量×小計、總金額與次要資訊

#### Scenario: 查無訂單
- **WHEN** 查詢結果為空陣列
- **THEN** 顯示「查無此電話的訂單」空狀態文字，不顯示錯誤

#### Scenario: 格式錯誤即時擋下
- **WHEN** 顧客輸入非手機格式並送出
- **THEN** 表單顯示紅字錯誤、不發出 API 請求

#### Scenario: 查詢失敗
- **WHEN** API 回 5xx 或網路錯誤
- **THEN** 顯示錯誤警示列，顧客可修改後重試

### Requirement: Navbar 查詢入口
Navbar SHALL 於桌面連結列與手機選單各提供「查詢訂單」項目，點擊後平滑捲動至查詢區塊；手機選單項目點擊後 SHALL 關閉選單。

#### Scenario: 桌面入口
- **WHEN** 顧客於桌面寬度點擊 Navbar 的「查詢訂單」
- **THEN** 頁面平滑捲動至查詢訂單區塊

#### Scenario: 手機入口
- **WHEN** 顧客於手機選單點擊「查詢訂單」
- **THEN** 選單關閉且頁面平滑捲動至查詢訂單區塊
