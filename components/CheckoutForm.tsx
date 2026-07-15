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
      className="bg-surface-container-low py-16 px-4 sm:px-6 lg:px-8 border-t border-surface-container-high"
    >
      {pendingDuplicate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/55 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="duplicate-order-title"
          aria-describedby="duplicate-order-message"
        >
          <div className="w-full max-w-md rounded-2xl border border-surface-dim bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-6 w-6 flex-shrink-0 text-warning" />
              <div className="space-y-2">
                <h3
                  id="duplicate-order-title"
                  className="text-lg font-bold text-primary"
                >
                  請確認訂單
                </h3>
                <p
                  id="duplicate-order-message"
                  className="text-sm font-medium leading-6 text-on-surface-variant"
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
                className="rounded-lg border border-secondary px-5 py-3 text-sm font-bold text-secondary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
              >
                返回確認
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitOrder(pendingDuplicate, true)}
                className="rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-secondary-bright disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "訂單送出中..." : "仍要送出"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-surface-container-high p-6 sm:p-8 shadow-md">
          {/* Section Header */}
          <div className="flex items-center space-x-3 pb-5 border-b border-surface-container mb-6">
            <ShoppingCart className="w-6 h-6 text-secondary" />
            <h2 className="text-xl sm:text-2xl font-bold text-primary font-sans tracking-wide">
              結帳與收貨資訊
            </h2>
          </div>

          {/* Cart items list summary panel */}
          <div className="mb-8 bg-surface-container-low border border-surface-dim rounded-xl overflow-hidden shadow-inner">
            <div className="p-4 sm:p-5 text-center flex flex-col space-y-3">
              <span className="text-on-surface-variant font-sans font-medium text-sm sm:text-base">
                購物車內目前有 {totalItems} 項商品
              </span>

              {/* Detailed items listed (collapsible or neat display) */}
              {totalItems > 0 && (
                <div className="max-h-40 overflow-y-auto px-1 text-left space-y-2 border-y border-surface-dim/50 py-3 bg-white/40 rounded-lg">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-center text-xs font-sans text-on-surface px-2 py-1 bg-white/60 rounded"
                    >
                      <span className="font-semibold">
                        {item.product.name}
                        {item.product.weight?.trim() && (
                          <span className="font-normal text-on-surface-variant">
                            {" "}
                            ({item.product.weight.split(" ")[0]})
                          </span>
                        )}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="text-on-surface-variant">
                          數量: {item.quantity}
                        </span>
                        <span className="font-bold text-secondary">
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
                          className="p-1 text-error rounded transition-colors hover:bg-error-container cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 px-1 font-sans">
                <span className="text-sm font-bold text-on-surface-variant">總計</span>
                <span className="text-lg sm:text-2xl font-bold text-secondary">
                  NT$ {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Alert for empty cart submission attempt */}
          {errors.cart && (
            <div className="mb-6 p-4 bg-error-container text-error rounded-lg text-sm font-medium flex items-center space-x-2 border border-error-container">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errors.cart}</span>
            </div>
          )}

          {/* Checkout Info Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 姓名 Input */}
              <div className="space-y-1.5">
                <label htmlFor="checkout-name" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-secondary" />
                  <span>
                    姓名 <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="checkout-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="請輸入真實姓名"
                    className={`w-full px-4 py-3 bg-surface border rounded-lg text-sm font-medium text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-secondary ${errors.name
                      ? "border-error focus:ring-error/40"
                      : "border-surface-dim hover:border-surface-tint"
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-bold text-error">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 聯絡電話 Input */}
              <div className="space-y-1.5">
                <label htmlFor="checkout-phone" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-secondary" />
                  <span>
                    聯絡電話 <span className="text-error">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="09XXXXXXXX"
                    className={`w-full px-4 py-3 bg-surface border rounded-lg text-sm font-medium text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-secondary ${errors.phone
                      ? "border-error focus:ring-error/40"
                      : "border-surface-dim hover:border-surface-tint"
                      }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs font-bold text-error">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* 取貨方式 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                <span>
                  取貨方式 <span className="text-error">*</span>
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
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-surface text-on-surface-variant border-surface-dim hover:border-surface-tint"
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
                <label htmlFor="checkout-city" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-secondary" />
                  <span>
                    取貨地點 <span className="text-error">*</span>
                  </span>
                </label>

                {spotsError ? (
                  <p className="text-xs font-bold text-error">
                    {spotsError}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 縣市 */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <select
                          id="checkout-city"
                          name="city"
                          value={formData.city}
                          onChange={handleCityChange}
                          disabled={spotsLoading}
                          className={`w-full px-4 py-3 bg-surface border rounded-lg text-sm font-medium text-on-surface appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 disabled:cursor-not-allowed ${errors.city
                            ? "border-error focus:ring-error/40"
                            : "border-surface-dim hover:border-surface-tint"
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
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
                        <p className="text-xs font-bold text-error">
                          {errors.city}
                        </p>
                      )}
                    </div>

                    {/* 鄉鎮市區 */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <select
                          aria-label="取貨地點（鄉鎮市區）"
                          name="township"
                          value={formData.township}
                          onChange={handleInputChange}
                          disabled={!formData.city}
                          className={`w-full px-4 py-3 bg-surface border rounded-lg text-sm font-medium text-on-surface appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 disabled:cursor-not-allowed ${errors.township
                            ? "border-error focus:ring-error/40"
                            : "border-surface-dim hover:border-surface-tint"
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
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
                        <p className="text-xs font-bold text-error">
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
                  <label htmlFor="checkout-address" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1">
                    <Home className="w-3.5 h-3.5 text-secondary" />
                    <span>
                      收件地址 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="請輸入完整收件地址"
                    className={`w-full px-4 py-3 bg-surface border rounded-lg text-sm font-medium text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-secondary ${errors.address
                      ? "border-error focus:ring-error/40"
                      : "border-surface-dim hover:border-surface-tint"
                      }`}
                  />
                  {errors.address && (
                    <p className="text-xs font-bold text-error">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* 運費在下單前先揭露，與訂單成功彈窗的運費資訊一致 */}
                <div className="p-3 bg-surface-container-low border border-surface-dim rounded-lg text-xs font-medium text-on-surface-variant space-y-1">
                  <p className="font-bold text-primary">運費另計</p>
                  <p>711店到店（10公斤）NT$ 150；宅配（20公斤）NT$ 250</p>
                  <p>下單後由客服與您確認運費並提供匯款帳號。</p>
                </div>
              </div>
            )}

            {/* 備註 Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="checkout-remarks" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-secondary" />
                <span>備註</span>
              </label>
              <textarea
                id="checkout-remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                maxLength={100}
                placeholder="有任何特殊需求請在此填寫..."
                className="w-full px-4 py-3 bg-surface border border-surface-dim hover:border-surface-tint rounded-lg text-sm font-medium text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
              />
              <p className="text-right text-xs font-medium text-on-surface-variant">
                {formData.remarks.length}/100
              </p>
            </div>

            {/* Alert for submission failure */}
            {errors.submit && (
              <div className="p-4 bg-error-container text-error rounded-lg text-sm font-medium flex items-center space-x-2 border border-error-container">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Call To Action Submit */}
            <div className="pt-2 flex flex-col items-center">
              <button
                type="submit"
                disabled={submitting || pendingDuplicate !== null}
                className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 bg-secondary hover:bg-secondary-bright text-white text-base font-bold rounded-lg transition-all duration-300 shadow-md flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
