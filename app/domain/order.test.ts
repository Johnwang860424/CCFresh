import { describe, expect, it } from "vitest";
import { prepareOrder } from "./order";
import type { PlaceOrderRequest, Product } from "@/types";

const products: Product[] = [{
  id: "1", name: "白蝦", weight: "500g", price: 300, images: [],
  badge: "第二件 8 折", category: "1",
  promo: { type: "second_item", config: { discount: 80 } },
}];

const request: PlaceOrderRequest = {
  customerName: " 測試者 ", phone: "0912-345-678",
  deliveryMethod: "delivery", address: " 台北市測試路 1 號 ",
  items: [{ productId: "1", quantity: 2 }],
};

describe("order domain", () => {
  it("normalizes input and prices from the authoritative catalog", () => {
    expect(prepareOrder(request, products)).toMatchObject({ value: {
      customerName: "測試者", phone: "0912345678",
      address: "台北市測試路 1 號", total: 540,
      lines: [{ quantity: 2, subtotal: 540 }],
    } });
  });

  it("merges duplicate lines before pricing", () => {
    const result = prepareOrder({ ...request, items: [
      { productId: "1", quantity: 1 }, { productId: "1", quantity: 2 },
    ] }, products);
    expect(result).toMatchObject({ value: { total: 840, lines: [{ quantity: 3 }] } });
  });

  it.each([
    [{ ...request, phone: "123" }, "請輸入有效的台灣手機號碼"],
    [{ ...request, address: "" }, "請輸入收件地址"],
    [{ ...request, items: [{ productId: "9", quantity: 1 }] }, "部分商品已下架，請重新整理購物車"],
    [{ ...request, items: [{ productId: "1", quantity: 1000 }] }, "商品數量不正確"],
  ])("rejects invalid requests", (input, error) => {
    expect(prepareOrder(input, products)).toEqual({ error });
  });

  it("rejects duplicate rows whose combined quantity exceeds the limit", () => {
    expect(prepareOrder({ ...request, items: [
      { productId: "1", quantity: 600 }, { productId: "1", quantity: 400 },
    ] }, products)).toEqual({ error: "商品數量不正確" });
  });
});
