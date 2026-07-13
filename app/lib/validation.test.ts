import { describe, expect, it } from "vitest";
import { sanitizePhoneInput, isValidTwMobile } from "./validation";

describe("validation library", () => {
  describe("sanitizePhoneInput", () => {
    it("allows only digits", () => {
      expect(sanitizePhoneInput("0912-345-678")).toBe("0912345678");
      expect(sanitizePhoneInput("0912abc345")).toBe("0912345");
      expect(sanitizePhoneInput("0912 345 678")).toBe("0912345678");
      expect(sanitizePhoneInput("0912-345-678#123")).toBe("0912345678");
    });

    it("restricts digit count to maximum of 10", () => {
      expect(sanitizePhoneInput("09123456789")).toBe("0912345678");
      expect(sanitizePhoneInput("0912-345-678-9")).toBe("0912345678");
      expect(sanitizePhoneInput("0912 345 678 9")).toBe("0912345678");
    });

    it("handles empty and short inputs", () => {
      expect(sanitizePhoneInput("")).toBe("");
      expect(sanitizePhoneInput("09")).toBe("09");
      expect(sanitizePhoneInput("a")).toBe("");
    });
  });

  describe("isValidTwMobile", () => {
    it("identifies valid Taiwan mobile numbers", () => {
      expect(isValidTwMobile("0912345678")).toBe(true);
      expect(isValidTwMobile("0912-345-678")).toBe(true);
      expect(isValidTwMobile("0912 345 678")).toBe(true);
    });

    it("rejects invalid mobile numbers", () => {
      expect(isValidTwMobile("0812345678")).toBe(false);
      expect(isValidTwMobile("091234567")).toBe(false);
      expect(isValidTwMobile("09123456789")).toBe(false);
      expect(isValidTwMobile("")).toBe(false);
    });
  });
});
