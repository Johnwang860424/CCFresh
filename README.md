# CC 生鮮 (CC Fresh)

冷凍食材線上訂購網站。使用 **Next.js (App Router)** + React 19 + Tailwind CSS v4。

## Run Locally

**Prerequisites:** Node.js

1. 安裝依賴：
   ```bash
   npm install
   ```
2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
   開啟 http://localhost:3000

## Scripts

- `npm run dev` — 開發模式 (http://localhost:3000)
- `npm run build` — 產出正式版
- `npm run start` — 啟動正式版伺服器
- `npm run lint` — 型別 / lint 檢查

## 專案結構

```
app/
  layout.tsx     # 根 layout、<html>/<body>、SEO metadata
  page.tsx       # 首頁 (Server Component)，渲染 <App/>
  globals.css    # Tailwind v4 + 主題變數
components/       # UI 元件 (互動元件標記 "use client")
data.ts          # 商品 / 取貨地點資料
types.ts         # 型別定義
```

> 註：目前下單為前端模擬（購物車存於 localStorage）。後端 API 待後續接入，
> 可放在 `app/api/` 下以 Route Handlers 實作。
