import { NextResponse } from "next/server";
import { createOrder } from "@/app/lib/orders";
import { jsonHandler } from "@/app/lib/api";

// 建立訂單。價格與促銷一律由後端依商品目錄重算，前端送來的金額不採信。
export const POST = jsonHandler(async (request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createOrder(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.order, { status: 201 });
});
