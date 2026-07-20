"use client";

import { useMemo, useState, ChangeEvent, SubmitEvent } from "react";
import {
  AlertCircle,
  Home,
  MapPin,
  Minus,
  Phone,
  Plus,
  Save,
  Store,
  Trash2,
  Truck,
  User,
  FileText,
  X,
} from "lucide-react";
import type {
  DeliveryMethod,
  LookupOrder,
  PickupSpot,
  Product,
  UpdateOrderRequest,
} from "../types";
import { calcLineSubtotal } from "../app/lib/promotions";
import {
  isValidCustomerName,
  isValidTwMobile,
  sanitizePhoneInput,
} from "../app/lib/validation";
import { useResource } from "../app/lib/useResource";

interface OrderEditFormProps {
  order: LookupOrder;
  /** 儲存成功：回傳更新後訂單，由父層就地替換。 */
  onSaved: (updated: LookupOrder) => void;
  onCancel: () => void;
}

interface EditItem {
  productId: string;
  /** 下架品項無法從目錄取名，保留快照品名顯示。 */
  name: string;
  quantity: number;
}

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 bg-surface border rounded-lg text-sm font-medium text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-secondary ${hasError
    ? "border-error focus:ring-error/40"
    : "border-surface-dim hover:border-surface-tint"
  }`;

/** 查詢結果訂單卡的內嵌編輯表單：品項增刪改、取貨方式/地點、訂購人、備註。 */
export default function OrderEditForm({
  order,
  onSaved,
  onCancel,
}: OrderEditFormProps) {
  const [form, setForm] = useState({
    name: order.customerName,
    phone: order.phone,
    deliveryMethod: order.deliveryMethod as DeliveryMethod,
    city: order.city,
    township: order.township,
    address: order.address,
    remarks: order.note ?? "",
  });
  const [items, setItems] = useState<EditItem[]>(
    order.items.map((it) => ({
      productId: it.productId,
      name: it.name,
      quantity: it.quantity,
    })),
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: productsData, loading: productsLoading, error: productsError } =
    useResource<Product[]>("/api/products", "商品目錄載入失敗，請稍後再試");
  const { data: spotsData, loading: spotsLoading, error: spotsError } =
    useResource<PickupSpot[]>("/api/pickup-spots", "取貨地點載入失敗，請稍後再試");

  const products = useMemo(() => productsData ?? [], [productsData]);
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  // 原訂單持有量：改單時會釋回，可訂上限 = 目前庫存 + 持有量。
  const heldById = useMemo(
    () => new Map(order.items.map((it) => [it.productId, it.quantity])),
    [order.items],
  );
  const capOf = (product: Product): number | null =>
    product.stock === null
      ? null
      : product.stock + (heldById.get(product.id) ?? 0);

  const spots = useMemo(() => spotsData ?? [], [spotsData]);
  const cities = useMemo(
    () => Array.from(new Set(spots.map((s) => s.city))),
    [spots],
  );
  const townships = useMemo(
    () => spots.filter((s) => s.city === form.city).map((s) => s.township),
    [spots, form.city],
  );

  const delistedIds = items
    .filter((it) => !productById.has(it.productId))
    .map((it) => it.productId);

  const total = items.reduce((sum, it) => {
    const product = productById.get(it.productId);
    return product
      ? sum + calcLineSubtotal(product.promo, product.price, it.quantity)
      : sum;
  }, 0);

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const finalValue = name === "phone" ? sanitizePhoneInput(value) : value;
    setForm((prev) => ({ ...prev, [name]: finalValue }));
    clearError(name);
  };

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setForm((prev) => ({ ...prev, city, township: "" }));
    clearError("city");
    clearError("township");
  };

  const changeQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.productId !== productId) return it;
        const product = productById.get(productId);
        const cap = product ? capOf(product) : null;
        const next = Math.max(1, it.quantity + delta);
        return { ...it, quantity: cap === null ? next : Math.min(next, cap) };
      }),
    );
    clearError("items");
    clearError("submit");
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
    clearError("items");
    clearError("submit");
  };

  const addProduct = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const product = productById.get(id);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      { productId: id, name: product.name, quantity: 1 },
    ]);
    clearError("items");
    clearError("submit");
    e.target.value = "";
  };

  const validate = (): boolean => {
    const next: { [key: string]: string } = {};
    if (!form.name) {
      next.name = "請輸入真實姓名";
    } else if (!isValidCustomerName(form.name)) {
      next.name = "姓名不可包含空白";
    }
    if (!form.phone.trim()) {
      next.phone = "請輸入聯絡電話";
    } else if (!isValidTwMobile(form.phone)) {
      next.phone = "請輸入有效的台灣手機號碼 (例如: 0912345678)";
    }
    if (form.deliveryMethod === "pickup") {
      if (!form.city) next.city = "請選擇縣市";
      else if (!form.township) next.township = "請選擇地點";
    } else if (!form.address.trim()) {
      next.address = "請輸入收件地址";
    }
    if (items.length === 0) {
      next.items = "訂單至少需要一項商品";
    } else if (delistedIds.length > 0) {
      next.items = "部分品項已下架，請移除後再儲存";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    const request: UpdateOrderRequest = {
      customerName: form.name,
      phone: form.phone,
      deliveryMethod: form.deliveryMethod,
      city: form.city,
      township: form.township,
      address: form.address,
      note: form.remarks,
      // 只送 id + 數量；價格由後端依商品目錄重算。
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      })),
      // 授權憑證：查詢命中的訂單電話（改前的電話，與可編輯的 phone 分離）。
      lookupPhone: order.phone,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data as { error?: string } | null)?.error ?? "訂單更新失敗",
        );
      }
      onSaved(data as LookupOrder);
    } catch (err) {
      console.error("Failed to update order", err);
      setErrors({
        submit: err instanceof Error ? err.message : "訂單更新失敗，請稍後再試",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-baseline gap-3">
        <span className="text-base font-semibold text-primary font-sans">
          編輯訂單（取貨號碼牌 {order.pickupCode}）
        </span>
      </div>

      {/* 訂購人 + 電話 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor={`edit-name-${order.id}`}
            className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1"
          >
            <User className="w-3.5 h-3.5 text-secondary" />
            <span>訂購人</span>
          </label>
          <input
            id={`edit-name-${order.id}`}
            type="text"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            className={inputClass(!!errors.name)}
          />
          {errors.name && (
            <p className="text-xs font-bold text-error">{errors.name}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor={`edit-phone-${order.id}`}
            className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1"
          >
            <Phone className="w-3.5 h-3.5 text-secondary" />
            <span>聯絡電話</span>
          </label>
          <input
            id={`edit-phone-${order.id}`}
            type="tel"
            inputMode="numeric"
            name="phone"
            value={form.phone}
            onChange={handleInputChange}
            className={inputClass(!!errors.phone)}
          />
          {errors.phone && (
            <p className="text-xs font-bold text-error">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* 品項編輯 */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          品項
        </span>
        {productsError ? (
          <p className="text-xs font-bold text-error">{productsError}</p>
        ) : (
          <div className="space-y-2 border border-surface-dim rounded-lg p-2 bg-white/40">
            {items.map((it) => {
              const product = productById.get(it.productId);
              const cap = product ? capOf(product) : null;
              const atCap = cap !== null && it.quantity >= cap;
              return (
                <div key={it.productId} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-sans text-on-surface px-2 py-1.5 bg-white/60 rounded gap-2">
                    <span className="font-semibold min-w-0 truncate">
                      {product?.name ?? it.name}
                      {!product && !productsLoading && (
                        <span className="ml-1.5 text-error font-bold">
                          已下架，請移除
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => changeQuantity(it.productId, -1)}
                          disabled={it.quantity <= 1}
                          aria-label={`減少 ${it.name} 數量`}
                          className="w-6 h-6 bg-white hover:bg-surface-container-high text-primary rounded-full flex items-center justify-center border border-surface-container-low cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="min-w-6 text-center font-semibold tabular-nums">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(it.productId, 1)}
                          disabled={!product || atCap}
                          aria-label={`增加 ${it.name} 數量`}
                          className="w-6 h-6 bg-secondary hover:bg-secondary-bright text-white rounded-full flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {product && (
                        <span className="font-bold text-secondary tabular-nums">
                          NT${" "}
                          {calcLineSubtotal(
                            product.promo,
                            product.price,
                            it.quantity,
                          ).toLocaleString()}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(it.productId)}
                        aria-label={`移除 ${it.name}`}
                        className="p-1 text-error rounded transition-colors hover:bg-error-container cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {atCap && (
                    <p className="px-2 text-xs font-medium text-on-surface-variant">
                      已達庫存上限（最多可訂 {cap}）
                    </p>
                  )}
                </div>
              );
            })}

            {/* 新增商品 */}
            <div className="relative">
              <select
                aria-label="新增商品"
                defaultValue=""
                onChange={addProduct}
                disabled={productsLoading}
                className="w-full px-3 py-2 bg-surface border border-surface-dim hover:border-surface-tint rounded-lg text-xs font-medium text-on-surface appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {productsLoading ? "商品載入中..." : "＋ 新增商品"}
                </option>
                {products
                  .filter((p) => !items.some((it) => it.productId === p.id))
                  .map((p) => {
                    const cap = capOf(p);
                    const soldOut = cap !== null && cap <= 0;
                    return (
                      <option key={p.id} value={p.id} disabled={soldOut}>
                        {p.name}（NT$ {p.price.toLocaleString()}）
                        {soldOut ? "｜售完" : ""}
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>
        )}
        {errors.items && (
          <p className="text-xs font-bold text-error flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errors.items}</span>
          </p>
        )}
        {/* 總計即時以現行目錄價格重算（商品若改價，儲存後金額以此為準） */}
        <div className="flex justify-between items-center font-sans pt-1">
          <span className="text-sm font-bold text-on-surface-variant">
            總計
          </span>
          <span className="text-lg font-bold text-secondary">
            NT$ {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 取貨方式 */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-secondary" />
          <span>取貨方式</span>
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "pickup", label: "指定地點自取", Icon: Store },
              { value: "delivery", label: "宅配/7-11", Icon: Truck },
            ] as const
          ).map(({ value, label, Icon }) => {
            const active = form.deliveryMethod === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, deliveryMethod: value }));
                  setErrors({});
                }}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-95 ${active
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-surface text-on-surface-variant border-surface-dim hover:border-surface-tint"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        {/* 換取貨點或換取貨方式後，號碼牌會重新編派 */}
        {form.deliveryMethod !== order.deliveryMethod && (
          <p className="text-xs font-medium text-on-surface-variant">
            變更取貨方式後，取貨號碼牌將重新編派
          </p>
        )}
      </div>

      {form.deliveryMethod === "pickup" ? (
        <div className="space-y-1.5">
          {spotsError ? (
            <p className="text-xs font-bold text-error">{spotsError}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <select
                  aria-label="取貨地點（縣市）"
                  name="city"
                  value={form.city}
                  onChange={handleCityChange}
                  disabled={spotsLoading}
                  className={`${inputClass(!!errors.city)} appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
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
                {errors.city && (
                  <p className="text-xs font-bold text-error">{errors.city}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <select
                  aria-label="取貨地點（鄉鎮市區）"
                  name="township"
                  value={form.township}
                  onChange={handleInputChange}
                  disabled={!form.city}
                  className={`${inputClass(!!errors.township)} appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {form.city ? "請選擇地點" : "請先選擇縣市"}
                  </option>
                  {townships.map((township) => (
                    <option key={township} value={township}>
                      {township}
                    </option>
                  ))}
                </select>
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
        <div className="space-y-1.5">
          <label
            htmlFor={`edit-address-${order.id}`}
            className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1"
          >
            <Home className="w-3.5 h-3.5 text-secondary" />
            <span>收件地址</span>
          </label>
          <input
            id={`edit-address-${order.id}`}
            type="text"
            name="address"
            value={form.address}
            onChange={handleInputChange}
            placeholder="請輸入完整收件地址"
            className={inputClass(!!errors.address)}
          />
          {errors.address && (
            <p className="text-xs font-bold text-error">{errors.address}</p>
          )}
        </div>
      )}

      {/* 備註 */}
      <div className="space-y-1.5">
        <label
          htmlFor={`edit-remarks-${order.id}`}
          className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1"
        >
          <FileText className="w-3.5 h-3.5 text-secondary" />
          <span>備註</span>
        </label>
        <textarea
          id={`edit-remarks-${order.id}`}
          name="remarks"
          value={form.remarks}
          onChange={handleInputChange}
          rows={2}
          maxLength={100}
          className={`${inputClass(false)} resize-none`}
        />
      </div>

      {/* 儲存失敗（驗證/庫存不足等），保留已編輯內容 */}
      {errors.submit && (
        <div className="p-3 bg-error-container text-error rounded-lg text-xs font-medium flex items-center space-x-2 border border-error-container">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary-bright text-white text-sm font-bold rounded-lg transition-all duration-300 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? "儲存中..." : "儲存變更"}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2.5 border border-secondary text-secondary text-sm font-bold rounded-lg transition-colors hover:bg-surface-container-low flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          <span>取消</span>
        </button>
      </div>
    </form>
  );
}
