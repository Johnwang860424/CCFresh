// 觸控滑動判定：只看水平位移是否達門檻，未達門檻回傳 null（不干擾點擊）。
// ponytail: 不做拖曳跟手動畫，需要時再引入手勢庫
export const SWIPE_THRESHOLD_PX = 40;

export type SwipeDirection = "left" | "right";

export function resolveSwipe(
  startX: number,
  endX: number,
  threshold: number = SWIPE_THRESHOLD_PX,
): SwipeDirection | null {
  const delta = endX - startX;
  if (Math.abs(delta) < threshold) return null;
  return delta < 0 ? "left" : "right";
}
