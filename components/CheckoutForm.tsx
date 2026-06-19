"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Send, ShoppingBag, MapPin, Phone, User, FileText, RefreshCw, AlertCircle, ShoppingCart } from "lucide-react";
import { CartItem, OrderFormData } from "../types";
import { DELIVERY_LOCATIONS } from "../data";

interface CheckoutFormProps {
  cart: CartItem[];
  onSubmitOrder: (formData: OrderFormData) => void;
  onClearCart: () => void;
}

export default function CheckoutForm({
  cart,
  onSubmitOrder,
  onClearCart
}: CheckoutFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    name: "",
    phone: "",
    location: "",
    remarks: ""
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when writing to the field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "請輸入真實姓名";
    }

    const phoneRegex = /^09\d{8}$|^09\d{2}-\d{6}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "請輸入聯絡電話";
    } else if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "請輸入有效的台灣手機號碼 (例如: 0912345678)";
    }

    if (!formData.location) {
      newErrors.location = "請選擇取貨/交貨地點";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (totalItems === 0) {
      setErrors({ cart: "購物車內目前沒有商品，請先向上下訂選購！" });
      return;
    }
    if (validateForm()) {
      onSubmitOrder(formData);
    }
  };

  return (
    <div id="checkout-section" className="bg-[#f0f3ff] py-16 px-4 sm:px-6 lg:px-8 border-t border-[#dee8ff]">
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
                    <div key={item.product.id} className="flex justify-between items-center text-xs font-sans text-[#111c2c] px-2 py-1 bg-white/60 rounded">
                      <span className="font-semibold">{item.product.name} ({item.product.weight.split(" ")[0]})</span>
                      <div className="space-x-3">
                        <span className="text-[#44474f]">數量: {item.quantity}</span>
                        <span className="font-bold text-[#0050cc]">NT$ {(item.product.price * item.quantity).toLocaleString()}</span>
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
                  <span>姓名 <span className="text-[#ba1a1a]">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="請輸入真實姓名"
                    className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] ${errors.name ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40" : "border-[#cfdaf1] hover:border-[#485e8a]"
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-bold text-[#ba1a1a]">{errors.name}</p>
                )}
              </div>

              {/* 聯絡電話 Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-[#0050cc]" />
                  <span>聯絡電話 <span className="text-[#ba1a1a]">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="09XX-XXXXXX"
                    className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] ${errors.phone ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40" : "border-[#cfdaf1] hover:border-[#485e8a]"
                      }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs font-bold text-[#ba1a1a]">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* 定點交貨地點 Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#00102d] uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#0050cc]" />
                <span>定點交貨地點 <span className="text-[#ba1a1a]">*</span></span>
              </label>
              <div className="relative">
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-[#f9f9ff] border rounded-lg text-sm font-medium text-[#111c2c] appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] ${errors.location ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40" : "border-[#cfdaf1] hover:border-[#485e8a]"
                    }`}
                >
                  <option value="">請選擇交貨地點</option>
                  {DELIVERY_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#44474f]">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {errors.location && (
                <p className="text-xs font-bold text-[#ba1a1a]">{errors.location}</p>
              )}
            </div>

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
                placeholder="有任何特殊需求請在此填寫..."
                className="w-full px-4 py-3 bg-[#f9f9ff] border border-[#cfdaf1] hover:border-[#485e8a] rounded-lg text-sm font-medium text-[#111c2c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cc] resize-none"
              />
            </div>

            {/* Call To Action Submit */}
            <div className="pt-2 flex flex-col items-center">
              <button
                type="submit"
                className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 bg-[#00102d] hover:bg-[#0050cc] text-white text-base font-bold rounded-lg transition-all duration-300 shadow-md flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95 hover:scale-[1.01]"
              >
                <Send className="w-4 h-4 rotate-45" />
                <span>送出訂單</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
