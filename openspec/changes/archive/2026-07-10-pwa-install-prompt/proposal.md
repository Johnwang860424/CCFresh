# Proposal: PWA 加入手機桌面引導（pwa-install-prompt）

## Why

顧客多以手機瀏覽器下單，每次都要重新找連結。把 CC 生鮮加入手機桌面後，一鍵開站、如 App 般以獨立視窗開啟，可提高回購下單的便利性與回訪率。下單完成當下是顧客黏著度最高的時刻，最適合做這個引導。

## What Changes

1. **PWA 基礎建設**：新增 Web App Manifest 與桌面圖示，讓「加入主畫面」後有正確的圖示（CC 生鮮 logo）、App 名稱，並以 standalone 獨立視窗開啟。**不做 service worker（無離線功能）**。
2. **下單成功彈窗內嵌引導**：在 `OrderSuccessModal` 內容區「最上方」新增高顯眼度的引導區塊，文案「**CC 生鮮加入手機桌面，下次下單更快速！**」＋「**查看教學**」按鈕。
3. **依裝置分流教學圖**：點「查看教學」以 lightbox 顯示教學圖——iOS 顯示 `public/pwa/IOS_0.jpg`（Safari 教學）、Android 顯示 `public/pwa/Android_0.jpg`（Chrome 教學）。
4. **顯示條件**：僅 iOS / Android 行動裝置顯示；已是 standalone 模式（已加入桌面並從圖示開啟）或桌機／無法辨識裝置時不顯示。
5. **Playwright e2e**：專案首次建置 Playwright，以行動裝置模擬驗證完整下單→引導→教學圖流程（`.env.local` 指向測試庫，允許真實寫入）。

## Out of Scope

- Service worker / 離線快取 / 推播通知
- Android 原生安裝提示（`beforeinstallprompt` 安裝橫幅）
- 「不再提醒」偏好記憶（每次下單完成都顯示）
- Neon 測試分支資料庫建置
- 桌機版加入捷徑教學

## Impact

- 新增：`app/manifest.ts`、`app/apple-icon.png`、`public/pwa/icon-192.png`、`public/pwa/icon-512.png`、`app/lib/pwa.ts`、`components/PwaInstallPrompt.tsx`、`playwright.config.ts`、`e2e/`
- 修改：`components/OrderSuccessModal.tsx`（嵌入引導區塊）、`package.json`（Playwright devDependency 與 `test:e2e` script）
- 不動：資料庫 schema、API routes、`orders.ts` 下單邏輯
