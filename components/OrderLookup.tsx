"use client";

import { useState, ChangeEvent, SubmitEvent } from "react";
import { Search, Phone, AlertCircle, Store, Truck } from "lucide-react";
import { LookupOrder } from "../types";
import { isValidTwMobile, sanitizePhoneInput } from "../app/lib/validation";

// 下單時間以本地格式呈現（查詢結果只在 client 渲染，無 hydration 疑慮）。
function formatOrderTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const METHOD_DISPLAY = {
  pickup: { label: "指定地點自取", Icon: Store },
  delivery: { label: "宅配到府", Icon: Truck },
} as const;

export default function OrderLookup() {
  const [phone, setPhone] = useState("");
  // null＝尚未查詢過；空陣列＝查過但無資料，兩者呈現不同。
  const [orders, setOrders] = useState<LookupOrder[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(sanitizePhoneInput(e.target.value));
    setError("");
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (searching) return;

    if (!isValidTwMobile(phone)) {
      setError("請輸入有效的台灣手機號碼 (例如: 0912345678)");
      return;
    }

    setSearching(true);
    setError("");
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data as { error?: string } | null)?.error ?? "查詢失敗",
        );
      }
      setOrders((data as { orders: LookupOrder[] }).orders);
    } catch (err) {
      console.error("Failed to look up orders", err);
      setOrders(null);
      setError(err instanceof Error ? err.message : "查詢失敗，請稍後再試");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      id="order-lookup"
      className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-t border-[#dee8ff]"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#dee8ff] p-6 sm:p-8 shadow-md">
          {/* Section Header */}
          <div className="flex items-center space-x-3 pb-5 border-b border-[#e7eeff] mb-6">
            <Search className="w-6 h-6 text-[#0050cc]" />
            <h2 className="text-xl sm:text-2xl font-black text-[#00102d] font-sans tracking-wide">
              查詢訂單
            </h2>
          </div>

          {/* 查詢表單：單一電話輸入 + 查詢按鈕 */}
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-[#0050cc]" />
              <span>訂購時的聯絡電話</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="09XXXXXXXX"
                className={`flex-1 px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] ${error
                  ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40"
                  : "border-[#cfdaf1] hover:border-[#485e8a]"
                  }`}
              />
              <button
                type="submit"
                disabled={searching}
                className="px-8 py-3 bg-[#00102d] hover:bg-[#0050cc] text-white text-sm font-bold rounded-lg transition-all duration-300 shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                <span>{searching ? "查詢中..." : "查詢"}</span>
              </button>
            </div>
            {error && (
              <p className="text-xs font-bold text-[#ba1a1a] flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </form>

          {/* 查詢結果：固定高度內部捲動，頁面長度不隨訂單數增加 */}
          {orders !== null &&
            (orders.length === 0 ? (
              <div className="mt-6 text-center py-10 bg-[#f9f9ff] rounded-xl border border-[#e7eeff]">
                <p className="text-[#44474f] font-sans text-sm font-medium">
                  查無此電話的訂單
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold text-[#44474f] font-sans">
                  共 {orders.length} 筆訂單
                </p>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                  {orders.map((order) => {
                    const method = METHOD_DISPLAY[order.deliveryMethod];
                    return (
                      <div
                        key={order.id}
                        className="bg-[#f0f3ff] border border-[#cfdaf1] rounded-xl p-4 sm:p-5 space-y-3"
                      >
                        {/* 主要資訊：編號 + 姓名 */}
                        <div className="flex justify-between items-baseline gap-3">
                          <span className="text-base font-black text-[#00102d] font-sans">
                            取貨號碼牌 {order.pickupCode}
                          </span>
                          <span className="text-xs font-medium text-[#44474f]">
                            {formatOrderTime(order.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#111c2c] font-sans">
                          訂購人：{order.customerName}
                        </p>

                        {/* 品項明細（正常訂單必有品項，空陣列僅防禦性略過） */}
                        {order.items.length > 0 && (
                          <div className="space-y-2 border-y border-[#cfdaf1]/50 py-3 bg-white/40 rounded-lg px-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-xs font-sans text-[#111c2c] px-2 py-1 bg-white/60 rounded"
                              >
                                <span className="font-semibold">{item.name}</span>
                                <div className="flex items-center space-x-3">
                                  <span className="text-[#44474f]">
                                    數量: {item.quantity}
                                  </span>
                                  <span className="font-bold text-[#0050cc]">
                                    NT$ {item.subtotal.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 總金額 */}
                        <div className="flex justify-between items-center font-sans">
                          <span className="text-sm font-bold text-[#44474f]">
                            總計
                          </span>
                          <span className="text-lg font-black text-[#0050cc]">
                            NT$ {order.total.toLocaleString()}
                          </span>
                        </div>

                        {/* 次要資訊：取貨方式與地點、備註 */}
                        <div className="text-xs font-medium text-[#44474f] font-sans space-y-1 pt-1 border-t border-[#cfdaf1]/50">
                          <p className="flex items-center space-x-1.5">
                            <method.Icon className="w-3.5 h-3.5 text-[#0050cc] flex-shrink-0" />
                            <span>
                              {method.label}｜{order.location}
                            </span>
                          </p>
                          {order.note && <p>備註：{order.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
