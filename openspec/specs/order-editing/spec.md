## ADDED Requirements

### Requirement: 訂單更新 API
系統 SHALL 提供 `PUT /api/orders/[id]`，body 為下單請求形狀（customerName、phone、deliveryMethod、city/township 或 address、note、items）加上 `lookupPhone`。伺服端 SHALL 以訂單 id 與正規化後的 `lookupPhone` 比對 `orders.phone`，不命中回 404 `{ error }`。更新 SHALL 走與下單相同的驗證與計價（`prepareOrder`，以現行商品目錄重算所有小計與總額，忽略前端金額）；驗證失敗回 400 `{ error }`，成功回 200 更新後的完整訂單（`LookupOrder` 形狀）。

#### Scenario: 成功更新
- **WHEN** 顧客以正確的 `lookupPhone` 送出合法的更新內容
- **THEN** 回 200，訂單欄位與品項更新，金額為現行目錄重算結果

#### Scenario: 憑證不符
- **WHEN** `lookupPhone` 與該訂單的電話不一致（或訂單不存在）
- **THEN** 回 404 `{ error }`，訂單不變

#### Scenario: 驗證失敗
- **WHEN** 更新內容不合法（如品項為空、電話格式錯誤、取貨點不存在）
- **THEN** 回 400 `{ error }`，訂單不變

### Requirement: 庫存差額原子調整
更新 SHALL 以「新數量 − 舊數量」的差額調整各商品庫存（移除品項還庫存、新增品項扣庫存；`stock IS NULL` 不追蹤者不調整），且訂單更新、明細替換、庫存調整 SHALL 在單一 SQL 語句內原子完成。庫存不足時 SHALL 由 `products_stock_nonneg` 約束使整句失敗（零部分效果），並回 400 與下單同款「庫存不足（剩餘 N）」訊息。庫存預檢 SHALL 以有效可售量（目前庫存 + 該商品在原訂單的數量）為準。庫存有變動時 SHALL 於成功後 revalidate `products` 快取並回敲管理端。

#### Scenario: 加量超過有效可售量
- **WHEN** 商品剩餘庫存 2、原訂單持有 3，顧客改為 6
- **THEN** 回 400「庫存不足」訊息（有效可售量 5），訂單與庫存皆不變

#### Scenario: 減量還庫存
- **WHEN** 顧客將某追蹤庫存商品由 5 件改為 2 件
- **THEN** 該商品庫存增加 3，訂單明細與總額同步更新

#### Scenario: 併發搶購
- **WHEN** 預檢通過但寫入時庫存已被併發訂單扣走
- **THEN** 整句原子失敗、回 400 庫存不足訊息，無任何部分寫入

### Requirement: 號碼牌重新編派
取貨點與取貨方式（自取⇄宅配）SHALL 皆可修改。更新後 `pickup_spot_id` 與原值不同（含改為/改自宅配的 NULL）時 SHALL 在新 scope 重新編派號碼牌（MAX+1，唯一鍵衝突重試）；`pickup_spot_id` 不變時 SHALL 保留原號碼。回應 SHALL 含更新後的 `pickupCode`。

#### Scenario: 換取貨點
- **WHEN** 顧客把自取訂單從 A 點（號碼 A3）換到 B 點
- **THEN** 訂單在 B 點取得新流水號（如 B7），回應的 `pickupCode` 為新號碼

#### Scenario: 未動取貨點
- **WHEN** 顧客只改品項或備註，取貨點不變
- **THEN** 號碼牌維持原號

#### Scenario: 自取改宅配
- **WHEN** 顧客把自取訂單改為宅配並填地址
- **THEN** `pickup_spot_id` 清為 NULL、於宅配 scope 重新編號，`pickupCode` 為純數字

### Requirement: 訂單卡編輯模式
查詢結果的每張訂單卡 SHALL 提供「編輯」按鈕，切換為內嵌編輯表單：可修改訂購人姓名、電話、取貨方式、取貨點（縣市/鄉鎮下拉）、宅配地址、備註，品項可增（現行目錄商品下拉）、刪、改數量，欄位驗證沿用結帳表單共用規則。表單 SHALL 即時以現行目錄價格重算並顯示總額。儲存成功 SHALL 以回傳資料就地更新該卡並退出編輯模式；若號碼牌變動 SHALL 顯著提示新號碼。伺服端錯誤訊息 SHALL 顯示於表單內且保留顧客已編輯的內容。編輯 SHALL 隨時可用，無時間或狀態限制。

#### Scenario: 編輯並儲存
- **WHEN** 顧客點「編輯」、改數量與備註後儲存
- **THEN** 卡片更新為新內容並退出編輯模式

#### Scenario: 號碼牌變動提示
- **WHEN** 儲存後 `pickupCode` 與編輯前不同
- **THEN** 卡片顯著提示新取貨號碼

#### Scenario: 儲存失敗保留輸入
- **WHEN** 儲存回 400（如庫存不足）
- **THEN** 錯誤訊息顯示於表單內，已編輯內容不遺失

### Requirement: 編輯品項的庫存上限呈現
編輯表單中追蹤庫存商品的數量上限 SHALL 為有效可售量（目前庫存 + 原訂單持有量）；達上限時 `+` 按鈕 SHALL disable 並顯示「已達庫存上限（最多可訂 N）」提示。新增商品下拉中有效可售量為 0 的商品 SHALL 標示售完且不可選；不限量商品（stock 為 null）SHALL 無上限。已不在現行目錄的原品項 SHALL 標示為已下架且必須移除後才能儲存。

#### Scenario: 達到上限
- **WHEN** 商品剩餘庫存 2、原訂單持有 3，顧客把數量按到 5
- **THEN** `+` 按鈕 disable 並顯示「已達庫存上限（最多可訂 5）」

#### Scenario: 售完商品不可新增
- **WHEN** 新增商品下拉中某商品庫存為 0 且不在原訂單
- **THEN** 該商品標示售完、不可選取

#### Scenario: 已下架品項
- **WHEN** 原訂單含已不在現行目錄的商品
- **THEN** 該品項標示已下架，顧客移除該品項後才能儲存
