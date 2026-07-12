import { revalidateTag } from "next/cache";

/**
 * 革除本地快取，並回敲後台的 /api/revalidate 讓後台同名快取一併失效
 * （下單扣庫存後，後台商品列表/訂單選單才會即時顯示最新剩餘量）。
 * 後台通知為 best-effort：失敗不應阻斷下單流程，但記錄以利排查；
 * 未設 ADMIN_URL（如本地開發）則只革除本地快取。
 */
export async function revalidateCache(tag: string) {
  revalidateTag(tag, { expire: 0 });

  const adminUrl = process.env.ADMIN_URL;
  if (!adminUrl) return;

  try {
    await fetch(`${adminUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ADMIN_SECRET_TOKEN}`,
      },
      body: JSON.stringify({ tag }),
    });
  } catch (err) {
    console.warn(`[revalidate] 通知後台失敗（tag=${tag}）：`, err);
  }
}
