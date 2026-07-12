import type { CartItem, Product } from "@/types";

export const CART_STORAGE_KEY = "cc_fresh_cart";

export interface StoredCartItem {
  id: string;
  quantity: number;
}

/** Parse both the current compact format and the legacy product-snapshot format. */
export function parseStoredCart(raw: string): StoredCartItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const value = entry as {
      id?: unknown;
      quantity?: unknown;
      product?: { id?: unknown };
    };
    const id = value.product?.id ?? value.id;
    const quantity = Number(value.quantity);
    return typeof id === "string" && Number.isInteger(quantity) && quantity > 0
      ? [{ id, quantity }]
      : [];
  });
}

export function changeCartQuantity(
  cart: StoredCartItem[],
  productId: string,
  delta: number,
): StoredCartItem[] {
  const current = cart.find((item) => item.id === productId);
  if (!current) {
    return delta > 0 ? [...cart, { id: productId, quantity: delta }] : cart;
  }
  const quantity = current.quantity + delta;
  return quantity <= 0
    ? cart.filter((item) => item.id !== productId)
    : cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      );
}

/** Hydrate compact cart rows from the latest catalog; delisted products disappear. */
export function hydrateCart(
  cart: StoredCartItem[],
  products: Product[],
): CartItem[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  return cart.flatMap(({ id, quantity }) => {
    const product = productById.get(id);
    return product ? [{ product, quantity }] : [];
  });
}
