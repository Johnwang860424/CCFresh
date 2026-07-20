import { expect, Page } from "@playwright/test";
import { randomInt } from "node:crypto";
import type { Category } from "@/types";

interface DeliveryOrderFields {
  name?: string;
  phone?: string;
  address?: string;
  remarks?: string;
  productId?: string;
}

function uniquePhone(): string {
  return `09${randomInt(0, 100_000_000).toString().padStart(8, "0")}`;
}

/** 填妥宅配訂單但不送出，供需控制確認流程的測試使用。 */
export async function fillDeliveryOrder(
  page: Page,
  fields: DeliveryOrderFields = {},
) {
  const {
    name = "E2E測試訂單",
    phone = uniquePhone(),
    address = "台北市中正區測試路 1 號",
    remarks,
    productId,
  } = fields;

  if (productId) {
    await page.addInitScript((id) => {
      localStorage.setItem(
        "cc_fresh_cart",
        JSON.stringify([{ id, quantity: 1 }]),
      );
    }, productId);
  }
  await page.goto("/");

  if (productId) {
    await expect(page.getByText("購物車內目前有 1 項商品")).toBeVisible();
  } else {
    // 測試庫的預設分類可能沒有現貨；逐一切換實際分類找可下單商品。
    const categoriesResponse = await page.request.get("/api/categories");
    expect(categoriesResponse.ok()).toBe(true);
    const categories = (await categoriesResponse.json()) as Category[];
    const addButton = page.getByRole("button", { name: "加入購物車" }).first();
    let foundSellableProduct = false;
    for (const category of categories) {
      await page
        .getByRole("button", { name: category.name, exact: true })
        .last()
        .click();
      try {
        await addButton.waitFor({ state: "visible", timeout: 2_000 });
        foundSellableProduct = true;
        break;
      } catch {
        // 繼續檢查下一個分類。
      }
    }
    if (!foundSellableProduct) throw new Error("測試庫沒有 UI 可下單商品");
    await addButton.click();
  }
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="phone"]').fill(phone);
  await page.getByRole("button", { name: "宅配/7-11" }).click();
  await page.locator('input[name="address"]').fill(address);
  if (remarks !== undefined) {
    await page.locator('textarea[name="remarks"]').fill(remarks);
  }
}

/** 真實下單（宅配）直到訂單成功彈窗出現；欄位可覆寫供後續斷言使用 */
export async function placeDeliveryOrder(
  page: Page,
  fields: DeliveryOrderFields = {},
) {
  await fillDeliveryOrder(page, fields);
  await page.getByRole("button", { name: "送出訂單" }).click();

  await expect(page.getByText("訂單已成立")).toBeVisible({ timeout: 15_000 });
}
