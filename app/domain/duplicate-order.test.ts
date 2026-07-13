import { describe, expect, it } from "vitest";
import {
  hasSameCustomerIdentity,
  isDuplicateOrderResponse,
  normalizeCustomerIdentity,
} from "./duplicate-order";
import {
  DUPLICATE_ORDER_CODE,
  DUPLICATE_ORDER_MESSAGE,
} from "@/types";

describe("duplicate order domain", () => {
  it("preserves the exact name and normalizes only phone formatting", () => {
    expect(normalizeCustomerIdentity({
      customerName: " 測試者 ",
      phone: "0912-345-678",
    })).toEqual({
      customerName: " 測試者 ",
      phone: "0912345678",
    });
  });

  it("matches only when the exact name and normalized phone are equal", () => {
    const existing = { customerName: "測試者", phone: "0912345678" };
    expect(hasSameCustomerIdentity(
      { customerName: "測試者", phone: "0912-345-678" },
      existing,
    )).toBe(true);
    expect(hasSameCustomerIdentity(
      { customerName: " 測試者 ", phone: "0912-345-678" },
      existing,
    )).toBe(false);
    expect(hasSameCustomerIdentity(
      { customerName: "其他人", phone: "0912345678" },
      existing,
    )).toBe(false);
    expect(hasSameCustomerIdentity(
      { customerName: "測試者", phone: "0987654321" },
      existing,
    )).toBe(false);
  });

  it("recognizes duplicate responses by status and code", () => {
    const response = {
      code: DUPLICATE_ORDER_CODE,
      error: DUPLICATE_ORDER_MESSAGE,
    };
    expect(isDuplicateOrderResponse(409, response)).toBe(true);
    expect(isDuplicateOrderResponse(400, response)).toBe(false);
    expect(isDuplicateOrderResponse(409, { error: response.error })).toBe(false);
  });
});
