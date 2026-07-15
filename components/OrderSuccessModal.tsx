"use client";

import { motion } from "motion/react";
import { CheckCircle2, ShoppingBag, X } from "lucide-react";
import { CartItem, OrderFormData, OrderConfirmation } from "../types";
import { calcLineSubtotal } from "../app/lib/promotions";
import PwaInstallPrompt from "./PwaInstallPrompt";

// 取貨地區 LINE 社群邀請連結。社群地區劃分與 pickup_spots 縣市鄉鎮無法一對一
// 對映（南投縣同時對到兩個社群）、宅配訂單也無取貨地區，故一律列出全部由顧客自選。
const LINE_GROUPS = [
  {
    region: "埔里/南投",
    url: "https://line.me/ti/g2/JYFCRuWLyDTddIAtq2Hv1BAJ-6w3p1eQ1YbmyQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  },
  {
    region: "彰化區",
    url: "https://line.me/ti/g2/Acg4Z2f5ULRisUXf0xzXVnpQGWqCm9zFTbc30Q?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  },
  {
    region: "新竹",
    url: "https://line.me/ti/g2/E0TZXMEMU3rNfgh3MSJjWFE19a5NQrs6wEJYxA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  },
  {
    region: "竹山/林內/斗六/嘉義",
    url: "https://line.me/ti/g2/fvppqDOTmsAHegEifx9mewll_Dj27SfxCAC5Cg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  },
  {
    region: "苗栗區",
    url: "https://line.me/ti/g2/FvrEoM746uqUqOMqa9UXnXeoDQAfvZbofOAjNg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  },
  {
    region: "桃園",
    url: "https://line.me/ti/g2/fym_9_9rqnhCffVvuJDE5iKThU3HYAvK7pGE4Q?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  },
  {
    region: "台中區",
    url: "https://line.me/ti/g2/EaRFMozU7jATXOfOc71XjtAm-3td0_7aI0sjRA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  },
];

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
        className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-surface-container-high z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-primary-fixed-dim" />
            <span className="font-bold tracking-wide font-sans">
              訂單已成立
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-primary-fixed-dim transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* 加入手機桌面引導（僅行動裝置且非 standalone 顯示） */}
          <PwaInstallPrompt />

          {/* Success banner */}
          <div className="flex flex-col items-center text-center space-y-2 pt-2">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 320 }}
            >
              <CheckCircle2 className="w-14 h-14 text-success fill-success-container" />
            </motion.div>
            <h3 className="text-lg font-bold text-primary font-sans">
              感謝您的訂購！
            </h3>
            <p className="text-xs text-on-surface-variant font-medium font-sans max-w-xs">
              訂單已成功送出。
            </p>
          </div>

          {/* 取貨號碼牌 / LINE客服資訊：依取貨方式獨立強調 */}
          {isPickup ? (
            <div className="bg-warning-container border border-warning/25 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-warning-container">
                  取貨號碼牌
                </span>
                <span className="text-xs text-on-warning-container/80 font-medium">
                  現場請憑此號碼取貨
                </span>
              </div>
              <span className="text-3xl font-bold font-mono text-promo leading-none">
                {confirmation.pickupCode}
              </span>
            </div>
          ) : (
            <div className="bg-success-container border border-success/25 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col space-y-1 max-w-[65%]">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-success-container">
                  聯絡官方 LINE 客服
                </span>
                <p className="text-xs text-on-success-container/80 font-medium leading-relaxed">
                  請加入 LINE 並提供訂單編號，客服將儘速為您確認運費並提供匯款帳號。
                </p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 bg-white/50 px-3 py-2 rounded-lg border border-[#06C755]/10 shadow-sm">
                <div className="text-center">
                  <span className="text-xs uppercase tracking-wider text-on-success-container/60 font-bold block">
                    訂單編號
                  </span>
                  <span className="text-xl font-bold font-mono text-on-success-container leading-none">
                    {confirmation.pickupCode}
                  </span>
                </div>
                <a
                  href="https://line.me/R/ti/p/@cc8888"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold rounded-md transition-all active:scale-95 text-center whitespace-nowrap shadow-sm"
                >
                  加入 LINE
                </a>
              </div>
            </div>
          )}

          {/* Receipt Summary Card */}
          <div className="border border-surface-container-high rounded-xl p-5 space-y-4 bg-white shadow-sm">
            <div className="space-y-2 text-xs text-on-surface font-sans">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">收貨姓名 :</span>
                <span className="font-bold">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">聯絡電話 :</span>
                <span className="font-bold font-mono">{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">
                  {isPickup ? "取貨地點 :" : "收件地址 :"}
                </span>
                <span className="font-bold">{formData.location}</span>
              </div>
              {formData.remarks && (
                <div className="flex flex-col space-y-1">
                  <span className="text-on-surface-variant font-medium">顧客備註 :</span>
                  <span className="text-on-surface-variant bg-surface-container-low p-2 rounded italic text-xs">
                    &ldquo;{formData.remarks}&rdquo;
                  </span>
                </div>
              )}
            </div>

            {/* Sub-item listed list in receipt */}
            <div className="pt-3 border-t border-surface-container space-y-2 max-h-36 overflow-y-auto">
              <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-widest block">
                訂購明細
              </span>
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between text-xs font-medium font-sans"
                >
                  <span className="text-primary">
                    {item.product.name}
                    {item.product.weight && ` (${item.product.weight})`}
                  </span>
                  <span className="text-on-surface-variant font-mono">
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
                <div className="flex justify-between pt-2 border-t border-dashed border-surface-container-high text-sm font-bold">
                  <span className="text-primary">實際應付金額</span>
                  <span className="text-secondary">
                    NT$ {totalPrice.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-dashed border-surface-container-high">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-primary">商品金額：</span>
                    <span className="text-secondary">
                      NT$ {totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-dashed border-surface-container-high space-y-1.5">
                    <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-widest block">
                      運費資訊
                    </span>
                    <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                      <span>711店到店 (10公斤)</span>
                      <span className="text-warning font-mono">NT$ 150</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                      <span>宅配 (20公斤)</span>
                      <span className="text-warning font-mono">NT$ 250</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 取貨地區 LINE 社群：列出全部地區由顧客自選（見 LINE_GROUPS 註解） */}
          <div className="bg-success-container border border-success/25 rounded-xl p-4 space-y-3">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-success-container">
                加入取貨地區 LINE 社群
              </span>
              <p className="text-xs text-on-success-container/80 font-medium leading-relaxed">
                點擊您取貨地區的社群，掌握最新到貨與取貨資訊。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LINE_GROUPS.map(({ region, url }) => (
                <a
                  key={region}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`加入 CC生鮮（${region}）LINE 社群`}
                  className="px-2 py-2 bg-white/70 border border-[#06C755]/25 text-on-success-container hover:bg-[#06C755] hover:text-white hover:border-[#06C755] text-xs font-bold rounded-md transition-all active:scale-95 text-center shadow-sm"
                >
                  {region}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="p-4 bg-surface border-t border-surface-container-high flex justify-center">
          <button
            onClick={onClose}
            className="w-full py-3 bg-secondary hover:bg-secondary-bright text-white text-sm font-bold rounded-lg cursor-pointer transition-colors active:scale-95 shadow-md flex items-center justify-center space-x-2"
          >
            <span>確認並返回首頁</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
