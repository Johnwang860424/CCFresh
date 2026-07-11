import { NextResponse } from "next/server";
import { findOrdersByPhone } from "@/app/lib/orders";
import { isValidTwMobile } from "@/app/lib/validation";
import { jsonHandler } from "@/app/lib/api";

// 電話查詢訂單。用 POST 讓電話不進 URL 與存取 log；查詢即時、不經快取。
export const POST = jsonHandler(async (request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phone = (body as Partial<{ phone: unknown }>)?.phone;
  if (typeof phone !== "string" || !isValidTwMobile(phone)) {
    return NextResponse.json(
      { error: "請輸入有效的台灣手機號碼" },
      { status: 400 },
    );
  }

  // 查無資料回 200 空陣列，讓前端呈現空狀態而非錯誤。
  return { orders: await findOrdersByPhone(phone) };
});
