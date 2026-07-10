import { test, expect, Page } from "@playwright/test";

// 覆蓋 openspec specs/pwa-install-prompt：下單完成後的加入桌面引導。
// 走真實 dev server + 測試庫（.env.local），下單一律用宅配（不依賴 pickup_spots 資料）。

const PROMPT = '[data-testid="pwa-install-prompt"]';

/** 真實下單（宅配）直到訂單成功彈窗出現 */
async function placeDeliveryOrder(page: Page) {
  await page.goto("/");

  // 商品由測試庫載入，等第一張商品卡的加入購物車按鈕
  await page
    .getByRole("button", { name: "加入購物車" })
    .first()
    .click();

  await page.locator('input[name="name"]').fill("E2E 測試訂單");
  await page.locator('input[name="phone"]').fill("0912345678");
  await page.getByRole("button", { name: "宅配到府" }).click();
  await page.locator('input[name="address"]').fill("台北市中正區測試路 1 號");
  await page.getByRole("button", { name: "送出訂單" }).click();

  await expect(page.getByText("訂單已成立")).toBeVisible({ timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  // 會寫 DB 的測試自行重置狀態，不假設環境乾淨
  await page.addInitScript(() => localStorage.removeItem("cc_fresh_cart"));
});

test.describe("行動裝置引導", () => {
  test("下單完成後引導區塊顯示在彈窗最上方", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "僅行動裝置 project");

    await placeDeliveryOrder(page);

    const prompt = page.locator(PROMPT);
    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText(
      "CC 生鮮加入手機桌面，下次下單更快速！",
    );

    // 「最上方」：引導區塊位於成功橫幅（感謝您的訂購）之上
    const promptBox = await prompt.boundingBox();
    const bannerBox = await page.getByText("感謝您的訂購！").boundingBox();
    expect(promptBox!.y).toBeLessThan(bannerBox!.y);
  });

  test("查看教學顯示對應裝置的教學圖，關閉後回到訂單彈窗", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "僅行動裝置 project");

    await placeDeliveryOrder(page);

    await page
      .locator(PROMPT)
      .getByRole("button", { name: "查看教學" })
      .click();

    const expected =
      testInfo.project.name === "ios" ? "IOS_0.jpg" : "Android_0.jpg";
    const tutorial = page.getByRole("img", { name: /加入主畫面教學/ });
    await expect(tutorial).toBeVisible();
    expect(await tutorial.getAttribute("src")).toContain(expected);

    await page.getByRole("button", { name: "關閉教學" }).click();
    await expect(tutorial).not.toBeVisible();
    // 回到訂單成功彈窗，原內容不變
    await expect(page.getByText("訂單已成立")).toBeVisible();
    await expect(page.locator(PROMPT)).toBeVisible();
  });
});

test.describe("不適用情境", () => {
  test("桌機下單完成不顯示引導區塊", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "僅桌機 project");

    await placeDeliveryOrder(page);

    await expect(page.getByText("感謝您的訂購！")).toBeVisible();
    await expect(page.locator(PROMPT)).toHaveCount(0);
  });

  test("standalone 模式下單完成不顯示引導區塊", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "android", "以 android project 模擬");

    // 模擬已從桌面圖示開啟：display-mode: standalone 命中
    // （偵測端只讀 .matches，stub 不需鋪陳完整 MediaQueryList 介面）
    await page.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = ((query: string) =>
        query === "(display-mode: standalone)"
          ? ({ matches: true, media: query } as unknown as MediaQueryList)
          : original(query)) as typeof window.matchMedia;
    });

    await placeDeliveryOrder(page);

    await expect(page.getByText("感謝您的訂購！")).toBeVisible();
    await expect(page.locator(PROMPT)).toHaveCount(0);
  });

  test("iOS navigator.standalone 模式下單完成不顯示引導區塊", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "ios", "覆蓋 iOS 專屬 standalone 分支");

    // iOS Safari 從桌面圖示開啟時 navigator.standalone === true
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { get: () => true });
    });

    await placeDeliveryOrder(page);

    await expect(page.getByText("感謝您的訂購！")).toBeVisible();
    await expect(page.locator(PROMPT)).toHaveCount(0);
  });

  test("LINE 內建瀏覽器下單完成不顯示引導區塊", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "android", "以 android project 模擬");

    // LINE in-app 瀏覽器 UA 含 " Line/"，沒有加入主畫面入口
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Line/14.0.0",
    });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.removeItem("cc_fresh_cart"));

    await placeDeliveryOrder(page);

    await expect(page.getByText("感謝您的訂購！")).toBeVisible();
    await expect(page.locator(PROMPT)).toHaveCount(0);
    await context.close();
  });
});
