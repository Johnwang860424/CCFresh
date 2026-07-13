"use client";

import { useState, useMemo, useEffect, ChangeEvent, SubmitEvent } from "react";
import {
  Send,
  MapPin,
  Phone,
  User,
  FileText,
  AlertCircle,
  ShoppingCart,
  Trash2,
  Store,
  Truck,
  Home,
  TriangleAlert,
} from "lucide-react";
import {
  CartItem,
  OrderFormData,
  PickupSpot,
  DeliveryMethod,
  OrderConfirmation,
  PlaceOrderRequest,
} from "../types";
import { calcLineSubtotal } from "../app/lib/promotions";
import {
  isValidCustomerName,
  isValidTwMobile,
  sanitizePhoneInput,
} from "../app/lib/validation";
import {
  saveOrderInfo,
  loadSavedOrderInfo,
} from "../app/lib/order-info-storage";
import { useResource } from "../app/lib/useResource";
import { isDuplicateOrderResponse } from "../app/domain/duplicate-order";

interface CheckoutFormProps {
  cart: CartItem[];
  onSubmitOrder: (
    formData: OrderFormData,
    confirmation: OrderConfirmation,
  ) => void;
  onRemoveItem: (productId: string) => void;
}

interface SubmissionSnapshot {
  formData: Omit<OrderFormData, "location">;
  location: string;
  request: PlaceOrderRequest;
}

export default function CheckoutForm({
  cart,
  onSubmitOrder,
  onRemoveItem,
}: CheckoutFormProps) {
  // location 為送出時才組出的顯示字串，不放進輸入狀態。
  const [formData, setFormData] = useState<Omit<OrderFormData, "location">>({
    name: "",
    phone: "",
    deliveryMethod: "pickup",
    city: "",
    township: "",
    address: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingDuplicate, setPendingDuplicate] =
    useState<SubmissionSnapshot | null>(null);

  // 帶入上次下單資料。須在掛載後才讀 localStorage，否則 SSR 首屏與 client 會 hydration 不一致。
  useEffect(() => {
    const saved = loadSavedOrderInfo();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setFormData(saved);
  }, []);

  const {
    data: spotsData,
    loading: spotsLoading,
    error: spotsError,
  } = useResource<PickupSpot[]>(
    "/api/pickup-spots",
    "取貨地點載入失敗，請稍後再試",
  );
  const spots = useMemo(() => spotsData ?? [], [spotsData]);

  // 縣市清單去重；鄉鎮市區依目前選到的縣市過濾。
  const cities = useMemo(
    () => Array.from(new Set(spots.map((s) => s.city))),
    [spots],
  );
  const townships = useMemo(
    () => spots.filter((s) => s.city === formData.city).map((s) => s.township),
    [spots, formData.city],
  );

  // 帶入的取貨地點可能已下架：spots 載入完成後對帳一次。
  // city 無效清 city+township；city 有效但 township 無效只清 township，其餘欄位照留。
  useEffect(() => {
    if (!spotsData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => {
      if (!prev.city && !prev.township) return prev;
      const cityValid = spotsData.some((s) => s.city === prev.city);
      if (!cityValid) return { ...prev, city: "", township: "" };
      const townshipValid = spotsData.some(
        (s) => s.city === prev.city && s.township === prev.township,
      );
      if (prev.township && !townshipValid) return { ...prev, township: "" };
      return prev;
    });
  }, [spotsData]);

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleMethodChange = (method: DeliveryMethod) => {
    setFormData((prev) => ({ ...prev, deliveryMethod: method }));
    setErrors({});
  };

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    // 換縣市時清掉已選的鄉鎮市區，避免殘留不相符的選項。
    setFormData((prev) => ({ ...prev, city, township: "" }));
    clearError("city");
    clearError("township");
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      calcLineSubtotal(item.product.promo, item.product.price, item.quantity),
    0,
  );

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const finalValue = name === "phone" ? sanitizePhoneInput(value) : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    // Clear errors when writing to the field
    clearError(name);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) {
      newErrors.name = "請輸入真實姓名";
    } else if (!isValidCustomerName(formData.name)) {
      newErrors.name = "姓名不可包含空白";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "請輸入聯絡電話";
    } else if (!isValidTwMobile(formData.phone)) {
      newErrors.phone = "請輸入有效的台灣手機號碼 (例如: 0912345678)";
    }

    if (formData.deliveryMethod === "pickup") {
      if (!formData.city) {
        newErrors.city = "請選擇縣市";
      } else if (!formData.township) {
        newErrors.township = "請選擇地點";
      }
    } else {
      if (!formData.address.trim()) {
        newErrors.address = "請輸入收件地址";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitOrder = async (
    snapshot: SubmissionSnapshot,
    confirmDuplicate = false,
  ) => {
    setSubmitting(true);
    clearError("submit");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...snapshot.request,
          ...(confirmDuplicate ? { confirmDuplicate: true } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (isDuplicateOrderResponse(res.status, data)) {
        setPendingDuplicate(snapshot);
        return;
      }
      if (!res.ok) {
        throw new Error(
          (data as { error?: string } | null)?.error ?? "訂單送出失敗",
        );
      }
      // 只有成功下單才記住訂購資料，供下次自動帶入。
      saveOrderInfo(snapshot.formData);
      setPendingDuplicate(null);
      onSubmitOrder(
        { ...snapshot.formData, location: snapshot.location },
        data as OrderConfirmation,
      );
    } catch (err) {
      console.error("Failed to submit order", err);
      setPendingDuplicate(null);
      setErrors({
        submit: err instanceof Error ? err.message : "訂單送出失敗，請稍後再試",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (submitting || pendingDuplicate) return;
    if (totalItems === 0) {
      setErrors({ cart: "購物車內目前沒有商品，請先向上下訂選購！" });
      return;
    }
    if (!validateForm()) return;

    const snapshot: SubmissionSnapshot = {
      formData: { ...formData },
      location:
        formData.deliveryMethod === "pickup"
          ? `${formData.city}${formData.township}`
          : formData.address,
      request: {
        customerName: formData.name,
        phone: formData.phone,
        deliveryMethod: formData.deliveryMethod,
        city: formData.city,
        township: formData.township,
        address: formData.address,
        note: formData.remarks,
        // 只送 id + 數量；價格由後端依商品目錄重算。
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      },
    };
    void submitOrder(snapshot);
  };

  return (
    <div
      id="checkout-section"
      className="bg-[#f0f3ff] py-16 px-4 sm:px-6 lg:px-8 border-t border-[#dee8ff]"
    >
      {pendingDuplicate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#00102d]/55 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="duplicate-order-title"
          aria-describedby="duplicate-order-message"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#cfdaf1] bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#ff900f]" />
              <div className="space-y-2">
                <h3
                  id="duplicate-order-title"
                  className="text-lg font-black text-[#00102d]"
                >
                  請確認訂單
                </h3>
                <p
                  id="duplicate-order-message"
                  className="text-sm font-medium leading-6 text-[#44474f]"
                >
                  系統偵測到您可能已有訂單，請確認是否為重複下單
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setPendingDuplicate(null)}
                className="rounded-lg border border-[#0050cc] px-5 py-3 text-sm font-bold text-[#0050cc] transition-colors hover:bg-[#f0f3ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                返回確認
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitOrder(pendingDuplicate, true)}
                className="rounded-lg bg-[#00102d] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0050cc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "訂單送出中..." : "仍要送出"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#dee8ff] p-6 sm:p-8 shadow-md">
          {/* Section Header */}
          <div className="flex items-center space-x-3 pb-5 border-b border-[#e7eeff] mb-6">
            <ShoppingCart className="w-6 h-6 text-[#0050cc]" />
            <h2 className="text-xl sm:text-2xl font-black text-[#00102d] font-sans tracking-wide">
              結帳與收貨資訊
            </h2>
          </div>

          {/* Cart items list summary panel */}
          <div className="mb-8 bg-[#f0f3ff] border border-[#cfdaf1] rounded-xl overflow-hidden shadow-inner">
            <div className="p-4 sm:p-5 text-center flex flex-col space-y-3">
              <span className="text-[#44474f] font-sans font-medium text-sm sm:text-base">
                購物車內目前有 {totalItems} 項商品
              </span>

              {/* Detailed items listed (collapsible or neat display) */}
              {totalItems > 0 && (
                <div className="max-h-40 overflow-y-auto px-1 text-left space-y-2 border-y border-[#cfdaf1]/50 py-3 bg-white/40 rounded-lg">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-center text-xs font-sans text-[#111c2c] px-2 py-1 bg-white/60 rounded"
                    >
                      <span className="font-semibold">
                        {item.product.name}
                        {item.product.weight?.trim() && (
                          <span className="font-normal text-[#44474f]">
                            {" "}
                            ({item.product.weight.split(" ")[0]})
                          </span>
                        )}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="text-[#44474f]">
                          數量: {item.quantity}
                        </span>
                        <span className="font-bold text-[#0050cc]">
                          NT${" "}
                          {calcLineSubtotal(
                            item.product.promo,
                            item.product.price,
                            item.quantity,
                          ).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          aria-label={`移除 ${item.product.name}`}
                          className="p-1 text-[#ba1a1a] rounded transition-colors hover:bg-[#ffdad6] cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 px-1 font-sans">
                <span className="text-sm font-bold text-[#44474f]">總計</span>
                <span className="text-lg sm:text-2xl font-black text-[#0050cc]">
                  NT$ {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Alert for empty cart submission attempt */}
          {errors.cart && (
            <div className="mb-6 p-4 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-sm font-medium flex items-center space-x-2 border border-[#ffdad6]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errors.cart}</span>
            </div>
          )}

          {/* Checkout Info Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 姓名 Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-[#0050cc]" />
                  <span>
                    姓名 <span className="text-[#ba1a1a]">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="請輸入真實姓名"
                    className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] ${errors.name
                      ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40"
                      : "border-[#cfdaf1] hover:border-[#485e8a]"
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-bold text-[#ba1a1a]">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 聯絡電話 Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-[#0050cc]" />
                  <span>
                    聯絡電話 <span className="text-[#ba1a1a]">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="09XXXXXXXX"
                    className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] ${errors.phone
                      ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40"
                      : "border-[#cfdaf1] hover:border-[#485e8a]"
                      }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs font-bold text-[#ba1a1a]">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* 取貨方式 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#0050cc]" />
                <span>
                  取貨方式 <span className="text-[#ba1a1a]">*</span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { value: "pickup", label: "指定地點自取", Icon: Store },
                    { value: "delivery", label: "宅配到府", Icon: Truck },
                  ] as const
                ).map(({ value, label, Icon }) => {
                  const active = formData.deliveryMethod === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleMethodChange(value)}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border text-sm font-bold transition-all cursor-pointer active:scale-95 ${active
                        ? "bg-[#00102d] text-white border-[#00102d] shadow-md"
                        : "bg-[#f9f9ff] text-[#44474f] border-[#cfdaf1] hover:border-[#485e8a]"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.deliveryMethod === "pickup" ? (
              /* 指定地點自取：先選縣市，再選鄉鎮市區 */
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0050cc]" />
                  <span>
                    取貨地點 <span className="text-[#ba1a1a]">*</span>
                  </span>
                </label>

                {spotsError ? (
                  <p className="text-xs font-bold text-[#ba1a1a]">
                    {spotsError}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 縣市 */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleCityChange}
                          disabled={spotsLoading}
                          className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] disabled:opacity-60 disabled:cursor-not-allowed ${errors.city
                            ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40"
                            : "border-[#cfdaf1] hover:border-[#485e8a]"
                            }`}
                        >
                          <option value="">
                            {spotsLoading ? "載入中..." : "請選擇縣市"}
                          </option>
                          {cities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#44474f]">
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                      {errors.city && (
                        <p className="text-xs font-bold text-[#ba1a1a]">
                          {errors.city}
                        </p>
                      )}
                    </div>

                    {/* 鄉鎮市區 */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <select
                          name="township"
                          value={formData.township}
                          onChange={handleInputChange}
                          disabled={!formData.city}
                          className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] disabled:opacity-60 disabled:cursor-not-allowed ${errors.township
                            ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40"
                            : "border-[#cfdaf1] hover:border-[#485e8a]"
                            }`}
                        >
                          <option value="">
                            {formData.city ? "請選擇地點" : "請先選擇縣市"}
                          </option>
                          {townships.map((township) => (
                            <option key={township} value={township}>
                              {township}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#44474f]">
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                      {errors.township && (
                        <p className="text-xs font-bold text-[#ba1a1a]">
                          {errors.township}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 宅配到府：自行填寫收件地址 */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                    <Home className="w-3.5 h-3.5 text-[#0050cc]" />
                    <span>
                      收件地址 <span className="text-[#ba1a1a]">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="請輸入完整收件地址"
                    className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] ${errors.address
                      ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40"
                      : "border-[#cfdaf1] hover:border-[#485e8a]"
                      }`}
                  />
                  {errors.address && (
                    <p className="text-xs font-bold text-[#ba1a1a]">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 備註 Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-[#0050cc]" />
                <span>備註</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                maxLength={100}
                placeholder="有任何特殊需求請在此填寫..."
                className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#cfdaf1] hover:border-[#485e8a] rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] resize-none"
              />
              <p className="text-right text-xs font-medium text-[#44474f]">
                {formData.remarks.length}/100
              </p>
            </div>

            {/* Alert for submission failure */}
            {errors.submit && (
              <div className="p-4 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-sm font-medium flex items-center space-x-2 border border-[#ffdad6]">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Call To Action Submit */}
            <div className="pt-2 flex flex-col items-center">
              <button
                type="submit"
                disabled={submitting || pendingDuplicate !== null}
                className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 bg-[#00102d] hover:bg-[#0050cc] text-white text-base font-bold rounded-lg transition-all duration-300 shadow-md flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-4 h-4 rotate-45" />
                <span>{submitting ? "訂單送出中..." : "送出訂單"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
