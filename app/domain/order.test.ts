import { describe, expect, it } from "vitest";
import { buildEffectiveCatalog, calcStockDeltas, prepareOrder } from "./order";
import type { PlaceOrderRequest, Product } from "@/types";

const products: Product[] = [{
  id: "1", name: "白蝦", weight: "500g", price: 300, images: [],
  badge: "第二件 8 折", category: "1",
  promo: { type: "second_item", config: { discount: 80 } },
  stock: null,
}];

const request: PlaceOrderRequest = {
  customerName: "測試者", phone: "0912-345-678",
  deliveryMethod: "delivery", address: " 台北市測試路 1 號 ",
  items: [{ productId: "1", quantity: 2 }],
};

describe("order domain", () => {
  it("normalizes input and prices from the authoritative catalog", () => {
    expect(prepareOrder(request, products)).toMatchObject({ value: {
      customerName: "測試者", phone: "0912345678",
      confirmDuplicate: false,
      address: "台北市測試路 1 號", total: 540,
      lines: [{ quantity: 2, subtotal: 540 }],
    } });
  });

  it.each([
    [undefined, false],
    [false, false],
    [true, true],
    ["true", false],
    [1, false],
  ])("only accepts strict true as duplicate confirmation", (input, expected) => {
    const result = prepareOrder({ ...request, confirmDuplicate: input }, products);
    expect(result).toMatchObject({ value: { confirmDuplicate: expected } });
  });

  it("merges duplicate lines before pricing", () => {
    const result = prepareOrder({ ...request, items: [
      { productId: "1", quantity: 1 }, { productId: "1", quantity: 2 },
    ] }, products);
    expect(result).toMatchObject({ value: { total: 840, lines: [{ quantity: 3 }] } });
  });

  it.each([
    [{ ...request, customerName: "王 小明" }, "姓名不可包含空白"],
    [{ ...request, customerName: "王　小明" }, "姓名不可包含空白"],
    [{ ...request, customerName: "\t測試者" }, "姓名不可包含空白"],
    [{ ...request, customerName: "測試者\n" }, "姓名不可包含空白"],
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

  it("rejects lines exceeding remaining stock with per-product messages", () => {
    const limited: Product[] = [
      { ...products[0], id: "1", name: "白蝦", stock: 1 },
      { ...products[0], id: "2", name: "干貝", stock: 0, promo: null, badge: null },
    ];
    expect(prepareOrder({ ...request, items: [
      { productId: "1", quantity: 2 }, { productId: "2", quantity: 1 },
    ] }, limited)).toEqual({
      error: "「白蝦」庫存不足（剩餘 1）；「干貝」庫存不足（剩餘 0）",
    });
  });

  it("accepts orders that exactly consume remaining stock", () => {
    const limited: Product[] = [{ ...products[0], stock: 2 }];
    expect(prepareOrder(request, limited)).toMatchObject({
      value: { lines: [{ quantity: 2 }] },
    });
  });
});

describe("buildEffectiveCatalog", () => {
  const tracked: Product = { ...products[0], id: "1", stock: 2 };
  const untracked: Product = { ...products[0], id: "2", stock: null };

  it("adds the held quantity back onto tracked stock", () => {
    const result = buildEffectiveCatalog(
      [tracked, untracked],
      [{ productId: 1, quantity: 3 }],
    );
    expect(result).toMatchObject([{ id: "1", stock: 5 }, { id: "2", stock: null }]);
  });

  it("leaves products the order does not hold unchanged", () => {
    expect(
      buildEffectiveCatalog([tracked], [{ productId: 9, quantity: 3 }]),
    ).toMatchObject([{ id: "1", stock: 2 }]);
  });

  it("lets prepareOrder accept quantities covered by the order's own holding", () => {
    // 庫存 0 但原訂單持有 2：改單維持 2 件必須通過預檢。
    const soldOut: Product[] = [{ ...products[0], stock: 0 }];
    const effective = buildEffectiveCatalog(soldOut, [{ productId: 1, quantity: 2 }]);
    expect(prepareOrder(request, effective)).toMatchObject({
      value: { lines: [{ quantity: 2 }] },
    });
  });
});

describe("calcStockDeltas", () => {
  it("computes new minus old per product and skips unchanged", () => {
    expect(
      calcStockDeltas(
        [
          { productId: 1, quantity: 5 }, // 減量 → 還庫存
          { productId: 2, quantity: 2 }, // 移除 → 全還
          { productId: 3, quantity: 4 }, // 不變 → 略過
        ],
        [
          { productId: 1, quantity: 2 },
          { productId: 3, quantity: 4 },
          { productId: 4, quantity: 1 }, // 新增 → 扣庫存
        ],
      ),
    ).toEqual([
      { productId: 1, delta: -3 },
      { productId: 2, delta: -2 },
      { productId: 4, delta: 1 },
    ]);
  });

  it("returns empty when nothing changed", () => {
    const lines = [{ productId: 1, quantity: 2 }];
    expect(calcStockDeltas(lines, lines)).toEqual([]);
  });
});
