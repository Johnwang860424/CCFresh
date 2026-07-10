import { expect, Page } from "@playwright/test";

interface DeliveryOrderFields {
  name?: string;
  phone?: string;
  address?: string;
  remarks?: string;
}

/** 真實下單（宅配）直到訂單成功彈窗出現；欄位可覆寫供後續斷言使用 */
export async function placeDeliveryOrder(
  page: Page,
  fields: DeliveryOrderFields = {},
) {
  const {
    name = "E2E 測試訂單",
    phone = "0912345678",
    address = "台北市中正區測試路 1 號",
    remarks,
  } = fields;

  await page.goto("/");

  // 商品由測試庫載入，等第一張商品卡的加入購物車按鈕
  await page.getByRole("button", { name: "加入購物車" }).first().click();

  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="phone"]').fill(phone);
  await page.getByRole("button", { name: "宅配到府" }).click();
  await page.locator('input[name="address"]').fill(address);
  if (remarks !== undefined) {
    await page.locator('textarea[name="remarks"]').fill(remarks);
  }
  await page.getByRole("button", { name: "送出訂單" }).click();

  await expect(page.getByText("訂單已成立")).toBeVisible({ timeout: 15_000 });
}
