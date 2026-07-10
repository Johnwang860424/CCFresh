## ADDED Requirements

### Requirement: Web App Manifest
系統 SHALL 於 `/manifest.webmanifest` 提供 Web App Manifest，內容包含 `name`／`short_name` 為「CC 生鮮」、`display: standalone`、`theme_color: #00102d`、`background_color: #f9f9ff`，以及 192 與 512 尺寸的 PNG 圖示（各含 `purpose: any` 與 `purpose: maskable`）。

#### Scenario: 請求 manifest
- **WHEN** 任一訪客請求 `/manifest.webmanifest`
- **THEN** 回傳 200，JSON 內容含上述欄位與 icon 路徑

#### Scenario: manifest 圖示可存取
- **WHEN** 逐一請求 manifest 內宣告的 icon 路徑
- **THEN** 均回傳 200 的 PNG 圖檔

### Requirement: 頁面 head 注入 PWA link
首頁 HTML `<head>` SHALL 含 manifest `<link>` 與 apple-touch-icon `<link>`（由 Next.js `app/manifest.ts` 與 `app/apple-icon.png` 檔案慣例自動注入），使 iOS 加入主畫面時取得正確桌面圖示。

#### Scenario: 檢視首頁 head
- **WHEN** 載入 `/` 並檢視 `<head>`
- **THEN** 存在 `rel="manifest"` 與 apple-touch-icon 的 `<link>` 標籤
