import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { jsonHandler } from "@/app/lib/api";

// 可被 revalidate 的 tag，對應 app/lib 內 unstable_cache 的設定。
const ALLOWED_TAGS = ["products", "categories", "pickup-spots"] as const;
type AllowedTag = (typeof ALLOWED_TAGS)[number];

function isAllowedTag(value: unknown): value is AllowedTag {
  return ALLOWED_TAGS.includes(value as AllowedTag);
}

// 後台改完資料後呼叫此 endpoint，讓對應的快取失效並重新抓取。
// 用 Bearer token 比對 ADMIN_SECRET_TOKEN 做授權。
export const POST = jsonHandler(async (request) => {
  const secret = process.env.ADMIN_SECRET_TOKEN;
  if (!secret) {
    // 設定缺失屬伺服器錯誤，交給 jsonHandler 記錄並回 500。
    throw new Error("ADMIN_SECRET_TOKEN is not set");
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tag = (body as { tag?: unknown } | null)?.tag;
  if (!isAllowedTag(tag)) {
    return NextResponse.json(
      { error: `Invalid tag. Allowed: ${ALLOWED_TAGS.join(", ")}` },
      { status: 400 },
    );
  }

  revalidateTag(tag, { expire: 0 });
  return { revalidated: true, tag, now: Date.now() };
});
