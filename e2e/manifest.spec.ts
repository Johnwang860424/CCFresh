import { test, expect } from "@playwright/test";

// 覆蓋 openspec specs/pwa-manifest：manifest 內容、head 注入、圖示可存取
test.describe("Web App Manifest", () => {
  test("manifest.webmanifest 內容正確", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);

    const manifest = await res.json();
    expect(manifest.name).toBe("CC 生鮮");
    expect(manifest.short_name).toBe("CC 生鮮");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#00102d");
    expect(manifest.background_color).toBe("#f9f9ff");

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  test("manifest 宣告的圖示均可存取", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    for (const icon of manifest.icons) {
      const res = await request.get(icon.src);
      expect(res.status(), `icon ${icon.src}`).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
    }
  });

  test("首頁 head 注入 manifest 與 apple-touch-icon link", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator('link[rel="manifest"][href="/manifest.webmanifest"]'),
    ).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });
});
