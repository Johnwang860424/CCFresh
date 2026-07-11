# Tasks: PWA 加入手機桌面引導

> 節奏：每完成一項 → 瀏覽器目視或跑測試確認 → 打勾 → 下一項。

## T1. PWA 基礎建設

- [x] T1.1 以 `sips` 從 `public/logo.jpg` 產出 `public/pwa/icon-192.png`、`public/pwa/icon-512.png`、`app/apple-icon.png`（180×180）
- [x] T1.2 新增 `app/manifest.ts`（name/short_name「CC 生鮮」、display standalone、theme_color `#00102d`、background_color `#f9f9ff`、icons 192/512 含 maskable）
- [x] T1.3 目視驗證：`npm run dev` 開 `/manifest.webmanifest` 確認內容；檢視首頁 `<head>` 有 manifest 與 apple-touch-icon link

## T2. 裝置偵測工具

- [x] T2.1 新增 `app/lib/pwa.ts`：`detectPwaPlatform()`（含 iPadOS 桌面版 UA 判斷）、`isStandaloneDisplay()`、`pwaTutorialImage()`；SSR 安全（無 `window` 時回 null/false）
- [x] T2.2 目視驗證：DevTools 裝置模擬（iPhone / Pixel / 桌機）在 console 驗證回傳值

## T3. PwaInstallPrompt 元件

- [x] T3.1 新增 `components/PwaInstallPrompt.tsx`：mount 後偵測 platform/standalone，不適用回傳 `null`
- [x] T3.2 引導區塊視覺：品牌漸層容器、Smartphone 搖擺圖示、主副文案、白底「查看教學」按鈕（hover/transition/active 依 design.md 互動視覺規格）
- [x] T3.3 教學圖 lightbox：`createPortal` 至 body（避開彈窗 transform 的 containing block 問題）、z-[60]、backdrop 點擊關閉、右上關閉鈕、next/image 依 platform 載入對應教學圖
- [x] T3.4 目視驗證：DevTools iPhone 模擬看 iOS 教學圖、Pixel 模擬看 Android 教學圖、桌機不顯示

## T4. 嵌入 OrderSuccessModal

- [x] T4.1 在內容捲動區第一個子元素位置嵌入 `<PwaInstallPrompt />`
- [x] T4.2 目視驗證：行動模擬下完整走一次下單 → 成功彈窗最上方看到引導區塊；桌機下單彈窗無此區塊且版面無位移

## T5. E2E 測試（最後任務群）

- [x] T5.1 建置 Playwright：`npm i -D @playwright/test` + `npx playwright install`、`playwright.config.ts`（webServer 起 `npm run dev`；projects: ios=iPhone 14 / android=Pixel 7 / desktop=Desktop Chrome）、`package.json` 加 `test:e2e` script
- [x] T5.2 `e2e/manifest.spec.ts`：覆蓋 `specs/pwa-manifest`——manifest 欄位內容與 icon 200 斷言
- [x] T5.3 `e2e/pwa-install-prompt.spec.ts`（ios project）：清 `cc_fresh_cart` → 加入商品 → 宅配下單 → 成功彈窗 → 引導區塊在最上方可見 → 查看教學顯示 `IOS_0.jpg`（Scenario「iOS 裝置下單完成」「iOS 查看教學」）
- [x] T5.4 同檔（android project）：同流程 → `Android_0.jpg` → 關閉 lightbox 回到訂單彈窗（Scenario「Android 查看教學」「關閉教學」）
- [x] T5.5 同檔（desktop project）：下單 → 彈窗開啟、引導區塊不存在（Scenario「桌機下單完成」）
- [x] T5.6 standalone 情境（android + `addInitScript` stub matchMedia）：下單 → 引導區塊不存在（Scenario「standalone 模式下單完成」）
- [x] T5.7 `npm run test:e2e` 全綠

## 實作前置檢查（設計確認後）

- [x] 功能分支：依使用者決定直接在 `feat/Celia/addQueryOrder` 進行，不另切分支
- [x] Schema：無改動，免辦
- [x] 新角色/權限：無，免辦
- [x] 技術遷移：無，免辦
