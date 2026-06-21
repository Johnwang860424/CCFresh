# CC 生鮮 (CC Fresh)

冷凍食材線上訂購網站。使用 **Next.js 16 (App Router)** + React 19 + Tailwind CSS v4，後端資料以 **Neon serverless Postgres** 儲存。

## Run Locally

**Prerequisites:** Node.js

1. 安裝依賴：
   ```bash
   npm install
   ```
2. 設定環境變數：複製 `.env.example` → `.env.local` 並填入：
   - `DATABASE_URL` — Neon Postgres 連線字串（使用 pooled connection）
   - `ADMIN_SECRET_TOKEN` — 保護 `POST /api/revalidate` 的 Bearer token
   - `AUTH_SECRET` — 預留給 NextAuth（尚未接入）
3. 啟動開發伺服器：
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
  layout.tsx       # 根 layout、<html>/<body>、SEO metadata
  page.tsx         # 首頁 (Server Component)，渲染 <App/>
  globals.css      # Tailwind v4 + 主題變數
  api/             # Route Handlers (products / categories / pickup-spots / orders / revalidate)
  lib/             # 伺服器端資料層（SQL 封裝、快取）+ 共用工具（promotions / validation）
components/         # UI 元件 (互動元件標記 "use client")
types.ts           # 共用型別定義
```

## 架構

資料流向：DB → 伺服器資料層 (`app/lib/`) → API route (`app/api/*`) → 前端。
首頁不做 server-side 商品渲染；`app/page.tsx` 渲染前端 `<App/>`，由其透過 `/api/*` 抓取資料。

- **資料層 (`app/lib/`)** — `db.ts` 匯出單一 `sql`（Neon HTTP driver）；
  `products` / `categories` / `pickup-spots` 的讀取函式以 `unstable_cache` 加上 cache tag 快取；
  `orders.ts` 的 `createOrder()` 負責下單（驗證 + 寫入），不快取。
- **API routes** — GET 為薄封裝；`POST /api/orders` 下單；
  `POST /api/revalidate` 為管理者專用（Bearer token），編輯資料後呼叫以使快取重新抓取。
- **前端** — `App.tsx` 為根元件，持有購物車狀態並存於 `localStorage` (`cc_fresh_cart`)，
  商品重載時會與最新型錄對帳（移除下架品、覆寫過期價格 / 名稱）。

> 安全性：`createOrder` 不信任前端傳來的金額，所有小計皆依 DB 型錄重新計算。

詳見 `CLAUDE.md`（架構與慣例）與 `DESIGN.md`（設計系統規範）。
