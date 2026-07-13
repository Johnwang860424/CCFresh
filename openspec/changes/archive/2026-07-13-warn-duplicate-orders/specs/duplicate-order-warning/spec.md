## ADDED Requirements

### Requirement: 訂單姓名不得包含空白
系統 SHALL 在建立訂單與執行重複偵測前，拒絕包含任何空白字元的姓名，包括一般空格、全形空格、Tab 與換行。結帳介面與建立訂單 API SHALL 對此錯誤顯示「姓名不可包含空白」，且系統 MUST NOT 建立訂單。

#### Scenario: 姓名包含中間空格
- **WHEN** 顧客輸入姓名 `王 小明`
- **THEN** 結帳介面阻止送出並顯示「姓名不可包含空白」

#### Scenario: 姓名包含首尾或控制空白
- **WHEN** 建立訂單請求的姓名包含首尾空格、全形空格、Tab 或換行
- **THEN** API 回傳 400 與「姓名不可包含空白」，且不執行重複查詢或任何訂單寫入

#### Scenario: 姓名不含空白
- **WHEN** 顧客輸入非空且不含任何空白字元的姓名
- **THEN** 系統繼續執行其餘訂單驗證與重複偵測

### Requirement: 以姓名與聯絡電話共同偵測疑似重複訂單
系統 SHALL 在建立新訂單前，以伺服器驗證後且未經 trim 的顧客姓名原值，以及經 `normalizePhone()` 正規化的聯絡電話，查詢所有既有訂單。姓名 SHALL 以 `orders.customer_name = customerName` 直接比對，不得使用 `btrim` 或其他空白移除。只有姓名與電話兩者皆相同時，系統 SHALL 判定為疑似重複訂單；姓名或電話任一不同時 SHALL NOT 判定為疑似重複。

#### Scenario: 姓名與電話皆相同
- **WHEN** 顧客送出的姓名與正規化電話皆與任一既有訂單相同
- **THEN** 系統判定該請求為疑似重複訂單

#### Scenario: 只有電話相同
- **WHEN** 顧客送出的正規化電話與既有訂單相同，但姓名不同
- **THEN** 系統不判定該請求為疑似重複訂單

#### Scenario: 只有姓名相同
- **WHEN** 顧客送出的姓名與既有訂單相同，但正規化電話不同
- **THEN** 系統不判定該請求為疑似重複訂單

#### Scenario: 既有姓名只有首尾空白不同
- **WHEN** 新請求姓名不含空白，但既有訂單的 `customer_name` 僅在首尾多出空白
- **THEN** 系統不移除既有姓名的空白，且不判定該請求為疑似重複訂單

#### Scenario: 電話格式不同但號碼相同
- **WHEN** 新請求的聯絡電話與既有訂單僅有空白或連字號格式差異，且姓名相同
- **THEN** 系統以相同的正規化電話完成比對並判定為疑似重複訂單

### Requirement: 未確認的疑似重複訂單不得建立
`POST /api/orders` SHALL 對未帶有效重複確認的疑似重複請求回傳 HTTP 409，body SHALL 包含穩定識別碼 `DUPLICATE_ORDER` 與訊息「系統偵測到您可能已有訂單。請確認是否為重複下單」。系統 MUST NOT 因該請求新增 `orders` 或 `order_items` 資料、扣減商品庫存或觸發成功後的快取更新。

#### Scenario: 未確認且偵測到疑似重複
- **WHEN** 有效的建立訂單請求未帶 `confirmDuplicate: true`，且姓名與電話皆命中既有訂單
- **THEN** API 回傳 409、`code: "DUPLICATE_ORDER"` 與指定訊息，且不產生任何訂單寫入或庫存異動

#### Scenario: 沒有疑似重複
- **WHEN** 有效的建立訂單請求未命中姓名與電話皆相同的既有訂單
- **THEN** 系統直接執行既有建立訂單流程，成功時回傳 201

### Requirement: 顧客可明確確認仍要送出
系統 SHALL 只把布林值 `confirmDuplicate: true` 視為顧客已確認疑似重複訂單。已確認的請求 SHALL 略過重複提醒，但 MUST 重新執行所有既有的輸入驗證、權威商品計價、取貨或配送驗證及原子庫存防超賣流程。

#### Scenario: 確認後建立重複訂單
- **WHEN** 姓名與電話皆命中既有訂單，且有效請求帶有布林值 `confirmDuplicate: true`
- **THEN** 系統不再回傳重複提醒，並依既有訂單流程建立訂單及回傳成功結果

#### Scenario: 非布林確認值不得繞過提醒
- **WHEN** 疑似重複請求帶有字串或其他非布林的 truthy `confirmDuplicate` 值
- **THEN** 系統仍回傳疑似重複訂單提醒且不建立訂單

#### Scenario: 確認後仍發生一般驗證錯誤
- **WHEN** 帶有 `confirmDuplicate: true` 的請求不符合既有訂單驗證或庫存規則
- **THEN** 系統回傳對應的既有錯誤且不因確認旗標略過該規則

### Requirement: 結帳介面要求顧客確認疑似重複訂單
結帳介面 SHALL 在收到 HTTP 409 且回應碼為 `DUPLICATE_ORDER` 時，顯示「⚠️ 系統偵測到您可能已有訂單。請確認是否為重複下單」，並提供返回檢查與仍要送出兩個動作。介面 SHALL 防止第一次請求、等待選擇與確認請求期間發生重複提交。

#### Scenario: 顯示疑似重複提示
- **WHEN** 建立訂單 API 回傳 409 與 `DUPLICATE_ORDER`
- **THEN** 結帳介面顯示指定訊息及返回檢查與仍要送出動作，且不顯示訂單成功畫面

#### Scenario: 顧客返回檢查
- **WHEN** 顧客在疑似重複提示中選擇返回檢查
- **THEN** 介面關閉提示、保留表單與購物車內容，且不送出確認請求

#### Scenario: 顧客確認仍要送出
- **WHEN** 顧客在疑似重複提示中選擇仍要送出
- **THEN** 介面以同一份訂單資料加上布林值 `confirmDuplicate: true` 重新呼叫建立訂單 API，並依回應顯示成功或既有錯誤

#### Scenario: 一般建立訂單錯誤
- **WHEN** API 回傳的錯誤不是 409 `DUPLICATE_ORDER`
- **THEN** 介面沿用一般送出錯誤處理且不顯示疑似重複確認介面
