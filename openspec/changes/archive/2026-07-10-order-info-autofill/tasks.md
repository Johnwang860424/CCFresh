# Tasks: 訂購資料記憶自動帶入

> 節奏：每完成一項 → 瀏覽器目視或跑測試確認 → 打勾 → 下一項。

## T1. 儲存模組

- [x] T1.1 新增 `app/lib/order-info-storage.ts`：`SavedOrderInfo` 型別（`Omit<OrderFormData, "location">`）、`saveOrderInfo()`、`loadSavedOrderInfo()`（形狀驗證＋壞資料自我移除），全部 localStorage 存取包 try/catch
- [x] T1.2 目視驗證：dev server console 手動呼叫 save/load，塞壞 JSON 確認回 null 且 key 被移除（以臨時 Playwright 單元測試等效驗證，6 案例全過後移除）

## T2. CheckoutForm 帶入與儲存

- [x] T2.1 mount 後 `useEffect` 呼叫 `loadSavedOrderInfo()`，有資料整份 `setFormData`
- [x] T2.2 `handleSubmit` 於 `res.ok` 後、`onSubmitOrder` 前呼叫 `saveOrderInfo(formData)`
- [x] T2.3 目視驗證：宅配下單成功 → reload → 七欄（含備註）皆帶入；DevTools 確認 `cc_fresh_order_info` 內容；模擬 API 失敗（route 回 500）確認不寫入（Playwright 腳本驗證全 PASS）

## T3. 下架取貨地點防護

- [x] T3.1 spots 首次載入完成後檢查：city 無效清 city+township；township 無效只清 township
- [x] T3.2 目視驗證：手動改 localStorage 的 city/township 為不存在值 → reload → 地點欄回「請選擇」、姓名電話保留（Playwright 腳本驗證 3 案例全 PASS，含 city 有效/township 無效與皆有效案例）

## T4. E2E 測試（最後任務群）

- [x] T4.1 確認 Playwright 基礎建設可用：已隨 main merge 帶入本分支（config、devDependency、script 齊備）
- [x] T4.2 `e2e/order-info-autofill.spec.ts`：真實宅配下單 → reload → 姓名／電話／宅配／地址／備註皆預填（Scenario「宅配下單成功」「有已存資料」）
- [x] T4.3 同檔：seed 不存在的 pickup city/township → 開頁 → 地點選單回「請選擇」、姓名電話已帶入（Scenario「縣市已下架」）
- [x] T4.4 同檔：seed 非法 JSON → 開頁 → 頁面正常、表單空白、key 被移除（Scenario「資料損毀」）
- [x] T4.5 測試 `beforeEach` 清 `cc_fresh_order_info`（用開頁後 evaluate 清除，不用 addInitScript——它每次導航重跑會清掉 reload 前剛存的資料）
- [x] T4.6 `npm run test:e2e` 全綠：14 passed / 10 skipped（project 專屬 skip，與 main 相同）

## 實作前置檢查（設計確認後）

- [x] 功能分支：`feat/Celia/rememberOrderInfo`（worktree 隔離，基於 main，避開另一 session 的未提交變更）
- [x] Schema：無改動，不需 migration
- [x] 角色/權限：無新增，不需測試帳號 env vars
- [x] 技術遷移：無
