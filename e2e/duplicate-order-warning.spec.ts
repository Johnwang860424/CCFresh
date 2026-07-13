import { randomInt } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { fillDeliveryOrder, placeDeliveryOrder } from "./helpers";
import type { LookupOrder, Product } from "@/types";

function uniquePhone(): string {
  return `09${randomInt(0, 100_000_000).toString().padStart(8, "0")}`;
}

async function lookupOrders(page: Page, phone: string): Promise<LookupOrder[]> {
  const response = await page.request.post("/api/orders/lookup", {
    data: { phone },
  });
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { orders: LookupOrder[] }).orders;
}

test("疑似重複訂單先提醒，返回不建單，確認後才建立", async ({ page }) => {
  const phone = uniquePhone();
  const name = `E2E重複訂單${Date.now()}`;
  const productsResponse = await page.request.get("/api/products");
  expect(productsResponse.ok()).toBe(true);
  const products = (await productsResponse.json()) as Product[];
  const product = products.find(
    (candidate) => candidate.stock === null || candidate.stock >= 2,
  );
  if (!product) throw new Error("測試庫沒有足以連續下兩單的商品");

  await placeDeliveryOrder(page, { name, phone, productId: product.id });
  await page.reload();

  await fillDeliveryOrder(page, {
    name,
    phone: `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`,
    productId: product.id,
  });
  await page.getByRole("button", { name: "送出訂單" }).click();

  const dialog = page.getByRole("alertdialog", { name: "請確認訂單" });
  await expect(dialog).toContainText(
    "系統偵測到您可能已有訂單。請確認是否為重複下單",
  );
  await dialog.getByRole("button", { name: "返回確認" }).click();
  await expect(dialog).toHaveCount(0);

  let orders = await lookupOrders(page, phone);
  expect(orders.filter((order) => order.customerName === name)).toHaveLength(1);

  await page.getByRole("button", { name: "送出訂單" }).click();
  await dialog.getByRole("button", { name: "仍要送出" }).click();
  await expect(page.getByText("訂單已成立")).toBeVisible({ timeout: 15_000 });

  orders = await lookupOrders(page, phone);
  expect(orders.filter((order) => order.customerName === name)).toHaveLength(2);
});

test("姓名包含空白時前後端皆拒絕", async ({ page }) => {
  const productsResponse = await page.request.get("/api/products");
  expect(productsResponse.ok()).toBe(true);
  const products = (await productsResponse.json()) as Product[];
  const product = products.find(
    (candidate) => candidate.stock === null || candidate.stock > 0,
  );
  if (!product) throw new Error("測試庫沒有可驗證訂單的商品");

  const phone = uniquePhone();
  await fillDeliveryOrder(page, {
    name: "王 小明",
    phone,
    productId: product.id,
  });

  let orderRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/orders")) {
      orderRequests += 1;
    }
  });
  await page.getByRole("button", { name: "送出訂單" }).click();
  await expect(page.getByText("姓名不可包含空白")).toBeVisible();
  expect(orderRequests).toBe(0);

  const response = await page.request.post("/api/orders", {
    data: {
      customerName: "王\t小明",
      phone,
      deliveryMethod: "delivery",
      address: "台北市中正區測試路1號",
      items: [{ productId: product.id, quantity: 1 }],
    },
  });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "姓名不可包含空白",
  });
});
