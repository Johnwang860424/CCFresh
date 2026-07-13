import { test, expect } from "@playwright/test";
import { ORDER_INFO_STORAGE_KEY as KEY } from "../app/lib/order-info-storage";
import { placeDeliveryOrder } from "./helpers";

// 覆蓋 openspec specs/order-info-autofill：下單成功後記住訂購資料，開站自動帶入。
// 走真實 dev server + 測試庫（.env.local），下單一律用宅配（不依賴 pickup_spots 資料）。
// 與裝置無關，只在 desktop project 跑（見 playwright.config.ts testIgnore）。

test.beforeEach(async ({ page }) => {
  // 會寫 DB 的測試自行重置狀態，不假設環境乾淨。
  // 不用 addInitScript：它每次導航都會重跑，會把測試中 reload 前剛存的資料也清掉。
  await page.goto("/");
  await page.evaluate((key) => {
    localStorage.removeItem("cc_fresh_cart");
    localStorage.removeItem(key);
  }, KEY);
});

test("宅配下單成功後 reload 自動帶入全部欄位", async ({ page }) => {
  // Scenario: 宅配下單成功 + 有已存資料
  await placeDeliveryOrder(page, {
    name: "E2E記憶測試",
    remarks: "E2E 備註",
  });

  await page.reload();

  await expect(page.locator('input[name="name"]')).toHaveValue("E2E記憶測試");
  await expect(page.locator('input[name="phone"]')).toHaveValue("0912345678");
  // 收件地址欄只在宅配模式渲染：有值即證明 deliveryMethod 也一併帶入
  await expect(page.locator('input[name="address"]')).toHaveValue(
    "台北市中正區測試路 1 號",
  );
  await expect(page.locator('textarea[name="remarks"]')).toHaveValue(
    "E2E 備註",
  );
});

test("已存縣市下架時地點選單回到請選擇，其餘欄位保留", async ({ page }) => {
  // Scenario: 縣市已下架
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        name: "E2E下架測試",
        phone: "0987654321",
        deliveryMethod: "pickup",
        city: "不存在市",
        township: "不存在區",
        address: "",
        remarks: "",
      }),
    );
  }, KEY);
  await page.goto("/");

  await expect(page.locator('input[name="name"]')).toHaveValue("E2E下架測試");
  await expect(page.locator('input[name="phone"]')).toHaveValue("0987654321");

  // 等取貨點清單載入完成（載入中選項消失）再驗證清空結果
  const citySelect = page.locator('select[name="city"]');
  await expect(citySelect.locator("option", { hasText: "載入中" })).toHaveCount(
    0,
  );
  await expect(citySelect).toHaveValue("");
  // city 被清空後，地點選單回到停用的「請先選擇縣市」空狀態
  const townshipSelect = page.locator('select[name="township"]');
  await expect(townshipSelect).toBeDisabled();
  await expect(townshipSelect).toHaveValue("");
});

test("資料損毀時頁面正常、表單空白、壞資料被移除", async ({ page }) => {
  // Scenario: 資料損毀
  await page.addInitScript((key) => {
    localStorage.setItem(key, "{這不是合法的JSON!!");
  }, KEY);
  await page.goto("/");

  // 頁面照常運作（商品目錄正常載入）
  await expect(
    page.getByRole("button", { name: "加入購物車" }).first(),
  ).toBeVisible();
  // 表單為空白初始值
  await expect(page.locator('input[name="name"]')).toHaveValue("");
  await expect(page.locator('input[name="phone"]')).toHaveValue("");
  // 壞資料被自我移除
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), KEY))
    .toBeNull();
});
