"use client";

import { motion } from "motion/react";
import { CheckCircle2, ShoppingBag, X } from "lucide-react";
import { CartItem, OrderFormData, OrderConfirmation } from "../types";
import { calcLineSubtotal } from "../app/lib/promotions";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: OrderFormData;
  confirmation: OrderConfirmation;
  cart: CartItem[];
}

export default function OrderSuccessModal({
  isOpen,
  onClose,
  formData,
  confirmation,
  cart,
}: OrderSuccessModalProps) {
  const totalPrice = confirmation.total;
  const isPickup = confirmation.deliveryMethod === "pickup";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#00102d]/80 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#dee8ff] z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#00102d] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-[#b0c6f9]" />
            <span className="font-bold tracking-wide font-sans">
              訂單已成立
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#b0c6f9] transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Success banner */}
          <div className="flex flex-col items-center text-center space-y-2 pt-2">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 320 }}
            >
              <CheckCircle2 className="w-14 h-14 text-emerald-500 fill-emerald-100" />
            </motion.div>
            <h3 className="text-lg font-black text-[#00102d] font-sans">
              感謝您的訂購！
            </h3>
            <p className="text-xs text-[#44474f] font-medium font-sans max-w-xs">
              訂單已成功送出。
            </p>
          </div>

          {/* 取貨號碼牌 / LINE客服資訊：依取貨方式獨立強調 */}
          {isPickup ? (
            <div className="bg-[#fff3e6] border border-[#ffd9b0] rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#ad5b00]">
                  取貨號碼牌
                </span>
                <span className="text-[10px] text-[#ad5b00]/80 font-medium">
                  現場請憑此號碼取貨
                </span>
              </div>
              <span className="text-3xl font-black font-mono text-[#ef6c00] leading-none">
                {confirmation.pickupNumber}
              </span>
            </div>
          ) : (
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col space-y-1 max-w-[65%]">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#166534]">
                  聯絡官方 LINE 客服
                </span>
                <p className="text-[10px] text-[#166534]/80 font-medium leading-relaxed">
                  請加入 LINE 並提供訂單編號，客服將儘速為您確認運費並提供匯款帳號。
                </p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 bg-white/50 px-3 py-2 rounded-lg border border-[#06C755]/10 shadow-sm">
                <div className="text-center">
                  <span className="text-[9px] uppercase tracking-wider text-[#166534]/60 font-bold block">
                    訂單編號
                  </span>
                  <span className="text-xl font-black font-mono text-[#166534] leading-none">
                    {confirmation.pickupNumber}
                  </span>
                </div>
                <a
                  href="https://line.me/R/ti/p/@cc8888"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-[10px] font-bold rounded-md transition-all active:scale-95 text-center whitespace-nowrap shadow-sm"
                >
                  加入 LINE
                </a>
              </div>
            </div>
          )}

          {/* Receipt Summary Card */}
          <div className="border border-[#dee8ff] rounded-xl p-5 space-y-4 bg-white shadow-sm">
            <div className="space-y-2 text-xs text-[#111c2c] font-sans">
              <div className="flex justify-between">
                <span className="text-[#44474f] font-medium">收貨姓名 :</span>
                <span className="font-bold">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474f] font-medium">聯絡電話 :</span>
                <span className="font-bold font-mono">{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474f] font-medium">
                  {isPickup ? "取貨地點 :" : "收件地址 :"}
                </span>
                <span className="font-bold">{formData.location}</span>
              </div>
              {formData.remarks && (
                <div className="flex flex-col space-y-1">
                  <span className="text-[#44474f] font-medium">顧客備註 :</span>
                  <span className="text-[#44474f] bg-slate-50 p-2 rounded italic text-[11px]">
                    &ldquo;{formData.remarks}&rdquo;
                  </span>
                </div>
              )}
            </div>

            {/* Sub-item listed list in receipt */}
            <div className="pt-3 border-t border-[#e7eeff] space-y-2 max-h-36 overflow-y-auto">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                訂購明細
              </span>
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between text-[11px] font-medium font-sans"
                >
                  <span className="text-[#00102d]">
                    {item.product.name}
                    {item.product.weight && ` (${item.product.weight})`}
                  </span>
                  <span className="text-[#44474f] font-mono">
                    {item.quantity} 份 · NT${" "}
                    {calcLineSubtotal(
                      item.product.promo,
                      item.product.price,
                      item.quantity,
                    ).toLocaleString()}
                  </span>
                </div>
              ))}
              {isPickup ? (
                <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 text-sm font-bold">
                  <span className="text-[#00102d]">實際應付金額</span>
                  <span className="text-[#0050cc]">
                    NT$ {totalPrice.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-dashed border-slate-200">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-[#00102d]">商品金額：</span>
                    <span className="text-[#0050cc]">
                      NT$ {totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      運費資訊
                    </span>
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>711店到店 (10公斤)</span>
                      <span className="text-amber-600 font-mono">NT$ 150</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>宅配 (20公斤)</span>
                      <span className="text-amber-600 font-mono">NT$ 250</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="p-4 bg-[#f9f9ff] border-t border-[#dee8ff] flex justify-center">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#00102d] hover:bg-[#0050cc] text-white text-sm font-bold rounded-lg cursor-pointer transition-colors active:scale-95 shadow-md flex items-center justify-center space-x-2"
          >
            <span>確認並返回首頁</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
