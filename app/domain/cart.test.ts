import { describe, expect, it } from "vitest";
import { changeCartQuantity, hydrateCart, parseStoredCart } from "./cart";
import type { Product } from "@/types";

const product: Product = {
  id: "1", name: "白蝦", weight: "500g", price: 300, images: [],
  badge: null, category: "1", promo: null, stock: null,
};

describe("cart domain", () => {
  it("reads current and legacy storage without throwing on corrupt data", () => {
    expect(parseStoredCart("not-json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify([
      { id: "1", quantity: 2 },
      { product: { id: "2" }, quantity: 1 },
      { id: "3", quantity: 0 },
    ]))).toEqual([{ id: "1", quantity: 2 }, { id: "2", quantity: 1 }]);
  });

  it("adds, increments, decrements, and removes immutable cart rows", () => {
    const added = changeCartQuantity([], "1", 1);
    expect(changeCartQuantity(added, "1", 2)).toEqual([{ id: "1", quantity: 3 }]);
    expect(changeCartQuantity(added, "1", -1)).toEqual([]);
  });

  it("hydrates from the latest catalog and drops delisted products", () => {
    expect(hydrateCart([{ id: "1", quantity: 2 }, { id: "9", quantity: 1 }], [product]))
      .toEqual([{ product, quantity: 2 }]);
  });

  it("drops sold-out products and caps quantities at remaining stock", () => {
    const soldOut: Product = { ...product, id: "2", stock: 0 };
    const limited: Product = { ...product, id: "3", stock: 2 };
    expect(hydrateCart(
      [{ id: "2", quantity: 1 }, { id: "3", quantity: 5 }, { id: "1", quantity: 4 }],
      [product, soldOut, limited],
    )).toEqual([
      { product: limited, quantity: 2 },
      { product, quantity: 4 },
    ]);
  });
});
