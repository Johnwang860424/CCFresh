import { test, expect } from "@playwright/test";
import { placeDeliveryOrder } from "./helpers";

// 覆蓋 openspec specs/order-success-line-groups：成立訂單彈窗顯示取貨地區 LINE 社群。
// 與裝置無關，只在 desktop project 跑（見 playwright.config.ts testIgnore）。

// 各地區連結以邀請碼識別（完整網址還帶 utm 參數，斷言帶碼即可）。
const EXPECTED_GROUPS: [region: string, inviteCode: string][] = [
  ["埔里/南投", "JYFCRuWLyDTddIAtq2Hv1BAJ-6w3p1eQ1YbmyQ"],
  ["彰化區", "Acg4Z2f5ULRisUXf0xzXVnpQGWqCm9zFTbc30Q"],
  ["新竹", "E0TZXMEMU3rNfgh3MSJjWFE19a5NQrs6wEJYxA"],
  ["竹山/林內/斗六/嘉義", "fvppqDOTmsAHegEifx9mewll_Dj27SfxCAC5Cg"],
  ["苗栗區", "FvrEoM746uqUqOMqa9UXnXeoDQAfvZbofOAjNg"],
  ["桃園", "fym_9_9rqnhCffVvuJDE5iKThU3HYAvK7pGE4Q"],
  ["台中區", "EaRFMozU7jATXOfOc71XjtAm-3td0_7aI0sjRA"],
];

test("下單成功彈窗顯示七個取貨地區社群連結", async ({ page }) => {
  // Scenario: 下單成功顯示社群清單
  await placeDeliveryOrder(page);

  await expect(page.getByText("加入取貨地區 LINE 社群")).toBeVisible();

  for (const [region, inviteCode] of EXPECTED_GROUPS) {
    const link = page.getByRole("link", {
      name: `加入 CC生鮮（${region}）LINE 社群`,
    });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      new RegExp(`^https://line\\.me/ti/g2/${inviteCode}`),
    );
    // Scenario: 點擊地區連結 — 新分頁開啟、彈窗保持開啟
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});
