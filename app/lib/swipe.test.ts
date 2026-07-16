import { describe, expect, it } from "vitest";
import { resolveSwipe, SWIPE_THRESHOLD_PX } from "./swipe";

describe("resolveSwipe", () => {
  it("位移未達門檻回傳 null（點擊不觸發換圖）", () => {
    expect(resolveSwipe(100, 100)).toBeNull();
    expect(resolveSwipe(100, 100 + SWIPE_THRESHOLD_PX - 1)).toBeNull();
    expect(resolveSwipe(100, 100 - SWIPE_THRESHOLD_PX + 1)).toBeNull();
  });

  it("向左滑（endX 較小）回傳 left", () => {
    expect(resolveSwipe(200, 200 - SWIPE_THRESHOLD_PX)).toBe("left");
  });

  it("向右滑回傳 right", () => {
    expect(resolveSwipe(200, 200 + SWIPE_THRESHOLD_PX)).toBe("right");
  });

  it("可自訂門檻", () => {
    expect(resolveSwipe(0, -10, 10)).toBe("left");
    expect(resolveSwipe(0, 9, 10)).toBeNull();
  });
});
