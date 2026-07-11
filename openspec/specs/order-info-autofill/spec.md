## ADDED Requirements

### Requirement: 下單成功後儲存訂購資料
系統 SHALL 在訂單送出成功（`POST /api/orders` 回 2xx）後，將表單七欄——`name`、`phone`、`deliveryMethod`、`city`、`township`、`address`、`remarks`（含備註）——以 JSON 存入 localStorage key `cc_fresh_order_info`。下單失敗時系統 SHALL NOT 寫入，既有已存資料保留。

#### Scenario: 宅配下單成功
- **WHEN** 顧客以宅配完成下單且 API 回 2xx
- **THEN** localStorage `cc_fresh_order_info` 存入本次的姓名、電話、`deliveryMethod: "delivery"`、地址與備註

#### Scenario: 自取下單成功
- **WHEN** 顧客以指定地點自取完成下單且 API 回 2xx
- **THEN** localStorage 存入本次的姓名、電話、`deliveryMethod: "pickup"`、縣市與取貨地點

#### Scenario: 下單失敗
- **WHEN** 訂單送出但 API 回 4xx/5xx 或網路錯誤
- **THEN** localStorage 既有內容不變

### Requirement: 開站自動帶入上次訂購資料
結帳表單載入後，系統 SHALL 自動以已存的訂購資料預填全部欄位（自動帶入，無需顧客操作），顧客可直接修改。無已存資料時表單 SHALL 維持空白初始值。

#### Scenario: 有已存資料
- **WHEN** 裝置上有合法的 `cc_fresh_order_info` 且顧客開啟網站
- **THEN** 姓名、電話、取貨方式、縣市／取貨地點或地址、備註皆已預填為上次的值

#### Scenario: 無已存資料
- **WHEN** 裝置上沒有 `cc_fresh_order_info`
- **THEN** 表單為空白初始值（取貨方式預設自取），行為與現況相同

### Requirement: 已下架取貨地點清除
取貨點清單載入完成後，若帶入的 `city` 不在最新縣市清單，系統 SHALL 清空 `city` 與 `township`；若 `city` 有效但 `township` 不在該縣市的地點清單，系統 SHALL 只清空 `township`。其餘欄位 SHALL 保留。

#### Scenario: 縣市已下架
- **WHEN** 帶入的縣市已不在最新取貨點清單
- **THEN** 縣市與地點選單回到「請選擇」，姓名電話等其餘欄位保留

#### Scenario: 地點已下架
- **WHEN** 帶入的縣市仍有效，但該地點已下架
- **THEN** 僅地點選單回到「請選擇」，縣市與其餘欄位保留

### Requirement: 儲存失效不影響下單
localStorage 不可用（無痕模式、隱私設定）或已存資料損毀（非法 JSON、形狀不符）時，系統 SHALL 靜默略過記憶功能：表單為空白初始值、下單流程照常運作、不拋出未捕捉錯誤。資料損毀時系統 SHALL 移除該 key。

#### Scenario: 資料損毀
- **WHEN** `cc_fresh_order_info` 內容非合法 JSON 或欄位形狀不符
- **THEN** 表單空白起始、該 key 被移除、頁面無錯誤

#### Scenario: localStorage 不可用
- **WHEN** localStorage 存取拋出例外
- **THEN** 表單行為與現況完全相同，下單成功照常完成（僅不儲存）
