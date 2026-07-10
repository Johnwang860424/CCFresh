# Design: PWA 加入手機桌面引導

## 架構總覽

```
app/manifest.ts            ← Next.js Metadata Route，自動輸出 /manifest.webmanifest 並注入 <link>
app/apple-icon.png         ← Next.js 檔案慣例，自動注入 apple-touch-icon（iOS 桌面圖示）
public/pwa/icon-192.png    ← manifest 圖示（Android 桌面 / 安裝對話框）
public/pwa/icon-512.png    ← manifest 圖示（splash / 高解析）
app/lib/pwa.ts             ← 純 client-safe 工具：裝置偵測 / standalone 偵測 / 教學圖路徑
components/PwaInstallPrompt.tsx ← 引導區塊 + 教學圖 lightbox（"use client"）
components/OrderSuccessModal.tsx ← 內容區最上方嵌入 <PwaInstallPrompt />
```

資料流：無後端、無 DB。所有邏輯在 client 以 `navigator.userAgent` / `matchMedia` 判斷。

## 1. Manifest（`app/manifest.ts`）

使用 Next.js `MetadataRoute.Manifest`：

| 欄位 | 值 |
|------|-----|
| `name` / `short_name` | `CC 生鮮` |
| `description` | 產地直達，鮮味直送。急凍真鮮冷鏈宅配。 |
| `start_url` | `/` |
| `display` | `standalone` |
| `background_color` | `#f9f9ff`（design token: surface） |
| `theme_color` | `#00102d`（design token: primary） |
| `icons` | 192/512 PNG，`purpose: any` 用滿版原圖；`purpose: maskable` 用有 ~20% 安全區補邊的獨立圖檔（`icon-*-maskable.png`），避免 Android 遮罩裁到 logo 邊緣 |

圖示製作（來源 `public/logo.jpg` 1000×1000）：
- **any 版（192/512）**：桌面平台（macOS/Windows Dock、工作列）直接原樣使用，故做成平台慣例樣式——透明畫布 + 白色圓角磁貼（占 80%，圓角 22.4%）+ logo 內縮 88%。以 headless chromium 渲染 HTML 後截圖產生（`omitBackground` 保留透明）。
- **maskable 版（192/512）**：logo 縮至 78% 置中、品牌底色 `#F9F9FF` 補邊至滿版，預留 Android 遮罩安全區。
- **apple-icon（180）**：滿版原圖。iOS 會自行套圓角遮罩，且透明角在 iOS 上會變黑，故不預先做圓角。

## 2. 裝置偵測（`app/lib/pwa.ts`）

比照 `promotions.ts` / `validation.ts` 的慣例：**client + server 皆可 import，不含 server-only 相依**（實際只在 client 呼叫）。

```ts
export type PwaPlatform = "ios" | "android";

detectPwaPlatform(): PwaPlatform | null
  // in-app 瀏覽器（LINE / FB / IG / Android WebView）→ null（沒有加入主畫面入口，教學無法照做）
  // /iphone|ipad|ipod/i → "ios"（含 iPadOS 桌面版 UA：Mac + maxTouchPoints > 1 也視為 ios）
  // /android/i → "android"
  // 其餘（桌機、無 window）→ null

isStandaloneDisplay(): boolean
  // matchMedia("(display-mode: standalone)").matches || navigator.standalone === true（iOS Safari 專屬屬性）
```

教學圖的 src + alt 對照表（`TUTORIALS`）放在 `PwaInstallPrompt` 元件內單點維護；lib 只做環境偵測。

## 3. `PwaInstallPrompt` 元件

- `"use client"`；內部狀態：`platform: PwaPlatform | null`（`useEffect` 內偵測，避免 SSR/hydration 不一致——初始 render 一律回 `null` 不顯示，mount 後才判斷）、`isTutorialOpen: boolean`。
- 偵測結果為 `null` 或 standalone → **回傳 `null`**，訂單彈窗版面完全不受影響。
- 顯示時不寫入任何 localStorage（每次下單完成都顯示）。

### 嵌入位置（`OrderSuccessModal.tsx`）

放在內容捲動區 `<div className="p-6 overflow-y-auto space-y-6">` 的**第一個子元素**（在「感謝您的訂購」成功橫幅之前），確保開啟彈窗第一眼就看到。

## 4. 互動視覺規格

### 引導區塊（顯眼設計）

- **容器**：`bg-gradient-to-r from-[#0050cc] to-[#00102d]`（secondary → primary 品牌漸層，與彈窗內其他白底卡片形成強烈對比）、`rounded-xl p-4`、`shadow-md`。
- **進場動畫**：motion/react `initial={{ opacity: 0, y: -8 }}` → `animate={{ opacity: 1, y: 0 }}`，spring（damping 20 / stiffness 300），比彈窗本體略晚 `delay: 0.15`，製造「跳出來」的注目感。
- **左側圖示**：lucide `Smartphone`，白色，外圈 `bg-white/15 rounded-full p-2`；圖示本體加 motion 無限輕微搖擺（`rotate: [-6, 6]`, repeat, duration 1.2s, repeatDelay 1.5s）吸引目光。
- **文案**：主標「**CC 生鮮加入手機桌面，下次下單更快速！**」白色 `text-sm font-black`；副標「不用下載 APP，一鍵開啟直接下單」`text-[10px] text-white/70 font-medium`。
- **查看教學按鈕**：白底 `bg-white text-[#0050cc] text-xs font-bold px-3 py-2 rounded-lg`、`hover:bg-[#dee8ff] transition-colors active:scale-95 cursor-pointer shadow-sm`、`whitespace-nowrap`。
- RWD：`flex items-center gap-3`，窄幕（<380px）按鈕仍在同列（`shrink-0`），文案自動換行。

### 教學圖 Lightbox

- **渲染位置**：以 `createPortal(..., document.body)` 渲染到 body。原因：訂單彈窗本體是帶 `scale` transform 的 `motion.div`，transform 會成為 `fixed` 子元素的 containing block，不用 portal 的話 lightbox 會被困在彈窗框內而非覆蓋全螢幕。
- **層級**：`fixed inset-0 z-[60]`（高於訂單彈窗的 `z-50`），背景 `bg-[#00102d]/90 backdrop-blur-sm`，點背景關閉。
- **進場**：backdrop fade（opacity 0→1），圖片 `scale 0.92→1 + opacity`，spring 同專案彈窗慣例。
- **圖片**：`<Image>`（next/image）依 platform 載入 `/pwa/IOS_0.jpg` 或 `/pwa/Android_0.jpg`；`max-h-[85vh] w-auto max-w-[95vw] object-contain rounded-xl`，教學圖為橫式長圖，手機上允許以寬度撐滿、上下留黑。
- **關閉鈕**：右上角 lucide `X`，白色 `hover:text-[#b0c6f9] transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer`，`aria-label="關閉教學"`。
- **鍵盤與捲動**：開啟時鎖住 body 捲動、Escape 可關閉（與 ProductCard lightbox 行為一致）；開啟期間暫停引導區塊的圖示搖擺動畫（避免在 backdrop-blur 底下持續耗用 GPU）。
- **關閉後**：回到訂單成功彈窗原狀態（lightbox 為 PwaInstallPrompt 內部 state，不影響父層）。

### 空／不適用狀態

- 桌機、無法辨識裝置、standalone 模式：元件回傳 `null`，無占位、無 layout shift。
- 教學圖載入中：lightbox 背景先出現，圖片以 next/image 原生行為載入（不做 skeleton）。

## 5. 錯誤處理

- `navigator` / `matchMedia` 不存在（SSR）：偵測函式一律回傳 `null` / `false`，不丟例外。
- 教學圖 404：next/image 原生破圖行為，不做額外 fallback（圖片為 repo 內靜態資產，版控保證存在）。

## 6. 測試策略（規格見 `specs/*/spec.md`，任務見 tasks.md）

- Playwright 首次建置：`@playwright/test` devDependency、`playwright.config.ts`、`e2e/` 目錄、`test:e2e` script。
- **裝置模擬**：三個 projects——`ios`（devices["iPhone 14"]，WebKit）、`android`（devices["Pixel 7"]，Chromium）、`desktop`（Desktop Chrome）。UA 分別含 `iPhone` / `Android`，直接驅動真實的偵測邏輯。
- **standalone 情境**：以 `addInitScript` stub `matchMedia("(display-mode: standalone)")` 回 `matches: true` 模擬。
- **資料**：走真實 dev server + `.env.local` 測試庫，下單用「宅配」流程（免依賴 pickup_spots 資料）；測試開場清除 `cc_fresh_cart` localStorage 自行重置狀態。
- **測試庫防護**：`e2e/global-setup.ts` 於啟動前驗證 DATABASE_URL 的 host 在 `ALLOWED_TEST_DB_HOSTS` 允許清單內（fail-closed），防止連線字串被換成正式庫後誤跑測試把假訂單寫進正式資料。
- **E2E 穩定性**：斷言一律 auto-waiting `expect(locator)`；locator 圈定在引導區塊／lightbox 範圍內，不假設全域唯一。
