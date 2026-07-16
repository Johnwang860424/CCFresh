import { NextResponse } from "next/server";
import { updateOrder } from "@/app/lib/orders";
import { jsonHandler } from "@/app/lib/api";

// 更新訂單。憑證＝id + lookupPhone（查詢時輸入的電話）；
// 價格與促銷一律由後端依商品目錄重算，前端送來的金額不採信。
export const PUT = jsonHandler<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { id } = await params;
    const result = await updateOrder(id, body);
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.notFound ? 404 : 400 },
      );
    }
    return NextResponse.json(result.order);
  },
);
