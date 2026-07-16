## MODIFIED Requirements

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
