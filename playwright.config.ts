import { defineConfig, devices } from "@playwright/test";

// 注意：本機 macOS 13 無法安裝 Playwright WebKit，ios project 以 chromium
// 掛 iPhone 14 裝置描述（UA / 視窗 / 觸控照常模擬）。UA 為主的平台偵測
// 因此照常覆蓋；但 WebKit 引擎本身的行為（Safari 專屬 bug）不在覆蓋範圍，
// iOS 專屬分支（navigator.standalone）以 initScript stub 補測。
// 多 session 並行時 3000 可能被其他工作目錄的 dev server 佔用，
// 以 PORT 覆寫（例如 PORT=3001）讓測試打到正確的伺服器。
const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  // 測試會寫入真實訂單：啟動前驗證 DATABASE_URL 指向已知測試庫，否則拒跑
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "ios",
      use: { ...devices["iPhone 14"], browserName: "chromium" },
      // manifest / order-info-autofill / order-lookup 測試與裝置無關，只在 desktop project 跑一次
      testIgnore: /manifest|order-info-autofill|order-lookup/,
    },
    {
      name: "android",
      use: { ...devices["Pixel 7"] },
      testIgnore: /manifest|order-info-autofill|order-lookup/,
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // CI 用正式 build 跑測試（dev 模式的 on-demand 編譯會拖慢並增加 flake）
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
