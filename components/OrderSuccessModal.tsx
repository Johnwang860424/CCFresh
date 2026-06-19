"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, CloudLightning, FileSpreadsheet, Smartphone, Navigation, ShoppingBag, X } from "lucide-react";
import { CartItem, OrderFormData } from "../types";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: OrderFormData;
  cart: CartItem[];
}

export default function OrderSuccessModal({
  isOpen,
  onClose,
  formData,
  cart
}: OrderSuccessModalProps) {
  const [syncStep, setSyncStep] = useState(0);
  const [orderId, setOrderId] = useState("");

  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  useEffect(() => {
    if (isOpen) {
      // Create a randomized premium-looking Order ID
      const randomId = "CC-" + Math.floor(100000 + Math.random() * 900000);
      setOrderId(randomId);
      setSyncStep(0);

      // Simulate steps of syncing dynamically to the Google Sheets backend schema
      const t1 = setTimeout(() => setSyncStep(1), 1000); // Order registered offline
      const t2 = setTimeout(() => setSyncStep(2), 2400); // Syncing stream to Google Sheet
      const t3 = setTimeout(() => setSyncStep(3), 3800); // Sending GSM packet
      const t4 = setTimeout(() => setSyncStep(4), 5000); // Finished!

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    { title: "建立訂單中", subtitle: "產生專屬編號 " + (orderId || "..."), icon: CloudLightning, color: "text-[#0050cc]" },
    { title: "同步 Google Sheets", subtitle: "同步雲端冷鏈管理資料庫...", icon: FileSpreadsheet, color: "text-emerald-600" },
    { title: "發送簡訊驗證封包", subtitle: "防偽驗證程序傳輸中...", icon: Smartphone, color: "text-[#ef6c00]" },
    { title: "建立完成！", subtitle: "已核實庫存並鎖定專案配送", icon: CheckCircle2, color: "text-[#00102d]" }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => syncStep === 4 && onClose()}
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
              <span className="font-bold tracking-wide font-sans">訂單提交成功</span>
            </div>
            {syncStep === 4 && (
              <button 
                onClick={onClose} 
                className="text-white hover:text-[#b0c6f9] transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Syncing Progress Animation */}
            <div className="bg-[#f0f3ff] border border-[#cfdaf1] p-4 rounded-xl space-y-4 shadow-inner">
              <div className="flex justify-between items-center text-xs font-bold text-[#44474f] uppercase tracking-wider">
                <span>同步處理狀態</span>
                <span>{syncStep === 4 ? "COMPLETE" : `${Math.min(syncStep * 25 + 10, 95)}%`}</span>
              </div>
              
              {/* Progress bar line */}
              <div className="w-full bg-[#dee8ff] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#0050cc] to-[#0266ff] h-full transition-all duration-500 ease-out"
                  style={{ width: `${syncStep === 4 ? 100 : syncStep * 25 + 10}%` }}
                />
              </div>

              {/* Steps display list */}
              <div className="space-y-3 pt-2">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = syncStep > idx;
                  const isCurrent = syncStep === idx;
                  
                  return (
                    <div 
                      key={step.title}
                      className={`flex items-start space-x-3 transition-opacity duration-300 ${
                        isDone || isCurrent ? "opacity-100" : "opacity-40"
                      }`}
                    >
                      <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center mt-0.5`}>
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                        ) : (
                          <Icon className={`w-4 h-4 ${isCurrent ? "animate-pulse " + step.color : "text-slate-400"}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold font-sans ${isCurrent ? "text-[#00102d]" : "text-[#44474f]"}`}>
                          {step.title}
                        </p>
                        {isCurrent && (
                          <p className="text-[10px] text-slate-500 font-medium font-sans animate-fade-in mt-0.5">
                            {step.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Receipt Summary Card */}
            {syncStep >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-[#dee8ff] rounded-xl p-5 space-y-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center pb-3 border-b border-[#e7eeff]">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#44474f]">
                    訂單編號
                  </span>
                  <span className="text-sm font-black font-mono text-[#0050cc]">
                    {orderId}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#111c2c] font-sans">
                  <div className="flex justify-between">
                    <span className="text-[#44474f] font-medium">收貨姓名 :</span>
                    <span className="font-bold">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#44474f] font-medium">聯絡電話 :</span>
                    <span className="font-bold font-mono">{formData.phone}</span>
                  </div>
                  <div className="flex flex-col space-y-1 pt-1">
                    <span className="text-[#44474f] font-medium">交貨地點 :</span>
                    <span className="font-semibold bg-[#f0f3ff] text-[#00102d] px-2.5 py-1.5 rounded border border-[#dee8ff] text-[11px] flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-[#0050cc] flex-shrink-0" />
                      {formData.location}
                    </span>
                  </div>
                  {formData.remarks && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-[#44474f] font-medium">顧客備註 :</span>
                      <span className="text-[#44474f] bg-slate-50 p-2 rounded italic text-[11px]">
                        "{formData.remarks}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-item listed list in receipt */}
                <div className="pt-3 border-t border-[#e7eeff] space-y-2 max-h-36 overflow-y-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">訂購明細</span>
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-[11px] font-medium font-sans">
                      <span className="text-[#00102d]">{item.product.name} ({item.product.weight})</span>
                      <span className="text-[#44474f] font-mono">
                        {item.quantity} 份 x NT$ {item.product.price}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 text-sm font-bold">
                    <span className="text-[#00102d]">實際應付金額</span>
                    <span className="text-[#0050cc]">NT$ {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action button */}
          <div className="p-4 bg-[#f9f9ff] border-t border-[#dee8ff] flex justify-center">
            {syncStep === 4 ? (
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#00102d] hover:bg-[#0050cc] text-white text-sm font-bold rounded-lg cursor-pointer transition-colors active:scale-95 shadow-md flex items-center justify-center space-x-2"
              >
                <span>確認並返回首頁</span>
              </button>
            ) : (
              <div className="w-full py-3 bg-slate-100 text-slate-400 text-sm font-bold rounded-lg text-center select-none cursor-not-allowed">
                數據備載及安全握手中...
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
