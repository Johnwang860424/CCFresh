import { test, expect, Page } from "@playwright/test";
import { placeDeliveryOrder } from "./helpers";

// 覆蓋 openspec specs/order-lookup-by-phone：電話查詢訂單。
// 走真實 dev server + 測試庫（.env.local），先真實下單再查詢。
// 與裝置無關，只在 desktop project 跑（見 playwright.config.ts testIgnore）。

// 每次執行產生唯一電話，避免撞到測試庫既有訂單影響筆數斷言。
function uniquePhone(): string {
  return `09${String(Date.now()).slice(-8)}`;
}

function lookupSection(page: Page) {
  return page.locator("#order-lookup");
}

async function searchPhone(page: Page, phone: string) {
  const section = lookupSection(page);
  await section.getByPlaceholder("09XXXXXXXX").fill(phone);
  await section.getByRole("button", { name: "查詢" }).click();
}

test("下單後以電話查得到訂單，連字號格式也命中", async ({ page }) => {
  // Scenario: 查得到訂單 + 帶連字號下單（寫入端正規化）
  const digits = uniquePhone();
  const hyphenated = `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;

  await placeDeliveryOrder(page, {
    name: "E2E 查詢測試",
    phone: hyphenated,
    remarks: "E2E 查詢備註",
  });

  // 關掉成功彈窗最簡單的方式：重新載入
  await page.reload();
  // 以純數字查詢連字號格式下的單，驗證正規化比對
  await searchPhone(page, digits);

  const section = lookupSection(page);
  await expect(section.getByText(/共 \d+ 筆訂單/)).toBeVisible({
    timeout: 15_000,
  });
  // 宅配訂單無站點代碼，取貨號維持純數字（自取訂單為代碼＋數字，如 A3）。
  await expect(section.getByText(/取貨號碼牌 \d+/)).toBeVisible();
  await expect(section.getByText("訂購人：E2E 查詢測試")).toBeVisible();
  await expect(section.getByText("數量: 1")).toBeVisible();
  await expect(section.getByText("總計")).toBeVisible();
  await expect(
    section.getByText("宅配到府｜台北市中正區測試路 1 號"),
  ).toBeVisible();
  await expect(section.getByText("備註：E2E 查詢備註")).toBeVisible();
});

test("未下過單的電話顯示查無訂單空狀態", async ({ page }) => {
  // Scenario: 查無訂單
  await page.goto("/");
  await searchPhone(page, uniquePhone());

  await expect(
    lookupSection(page).getByText("查無此電話的訂單"),
  ).toBeVisible({ timeout: 15_000 });
});

// 先等商品目錄載完再捲動：載入中點擊會在商品渲染撐高版面後被推離目標位置
async function waitForCatalog(page: Page) {
  await expect(
    page.getByRole("button", { name: "加入購物車" }).first(),
  ).toBeVisible({ timeout: 15_000 });
}

test("桌面 Navbar 的查詢訂單捲動到查詢區塊", async ({ page }) => {
  // Scenario: 桌面入口
  await page.goto("/");
  await waitForCatalog(page);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "查詢訂單" })
    .click();

  await expect(lookupSection(page)).toBeInViewport();
});

test("手機選單的查詢訂單捲動到查詢區塊並收合選單", async ({ page }) => {
  // Scenario: 手機入口（desktop project 內縮小視窗走手機版選單）
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await waitForCatalog(page);

  // getByRole 不比對 CSS 隱藏的桌面版按鈕，手機寬度下只會找到選單內那顆
  const navLookupButton = page
    .getByRole("navigation")
    .getByRole("button", { name: "查詢訂單" });
  await page.getByRole("button", { name: "Toggle Menu" }).click();
  await navLookupButton.click();

  await expect(lookupSection(page)).toBeInViewport();
  // 選單已收合：選單內那顆消失，隱藏中的桌面版也不再被比對到
  await expect(navLookupButton).toHaveCount(0);
});

test("電話格式錯誤時前端擋下並顯示錯誤", async ({ page }) => {
  // Scenario: 格式錯誤即時擋下
  await page.goto("/");
  await searchPhone(page, "12345");

  const section = lookupSection(page);
  await expect(
    section.getByText("請輸入有效的台灣手機號碼 (例如: 0912345678)"),
  ).toBeVisible();
  // 沒有發出查詢：不出現任何結果狀態
  await expect(section.getByText("查無此電話的訂單")).toHaveCount(0);
  await expect(section.getByText(/共 \d+ 筆訂單/)).toHaveCount(0);
});
