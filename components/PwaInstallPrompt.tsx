"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "motion/react";
import { Smartphone, X } from "lucide-react";
import {
  detectPwaPlatform,
  isStandaloneDisplay,
  PwaPlatform,
} from "../app/lib/pwa";
import { useFocusTrap } from "../app/lib/useFocusTrap";

const emptySubscribe = () => () => {};

// 平台 → 教學圖的唯一對照表（src 與 alt 一起維護，避免分岔）
const TUTORIALS: Record<PwaPlatform, { src: string; alt: string }> = {
  ios: { src: "/pwa/IOS_0.jpg", alt: "iPhone Safari 加入主畫面教學" },
  android: { src: "/pwa/Android_0.jpg", alt: "Android Chrome 加入主畫面教學" },
};

/**
 * 下單完成後的「加入手機桌面」引導區塊。
 * 僅 iOS / Android 且非 standalone 模式顯示；以 useSyncExternalStore
 * 讀取瀏覽器環境值，server snapshot 固定為 null，避免 hydration 不一致。
 */
export default function PwaInstallPrompt() {
  const platform = useSyncExternalStore(
    emptySubscribe,
    () => (isStandaloneDisplay() ? null : detectPwaPlatform()),
    () => null,
  );
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const tutorialRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(tutorialRef, isTutorialOpen);

  // 教學圖開啟時鎖住背景捲動、支援 Escape 關閉（與 ProductCard lightbox 行為一致）
  useEffect(() => {
    if (!isTutorialOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsTutorialOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isTutorialOpen]);

  if (!platform) return null;

  const tutorial = TUTORIALS[platform];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.15 }}
      className="bg-gradient-to-r from-secondary to-primary rounded-xl p-4 shadow-md flex items-center gap-3"
      data-testid="pwa-install-prompt"
    >
      <div className="bg-white/15 rounded-full p-2 shrink-0">
        <motion.div
          // 教學圖開啟時停止搖擺，避免在 backdrop-blur 底下持續耗用 GPU
          animate={isTutorialOpen ? { rotate: 0 } : { rotate: [-6, 6, -6] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <Smartphone className="w-5 h-5 text-white" />
        </motion.div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white font-sans leading-snug">
          CC 生鮮加入手機桌面，下次下單更快速！
        </p>
        <p className="text-xs text-white/70 font-medium font-sans mt-0.5">
          不用下載 APP，一鍵開啟直接下單
        </p>
      </div>
      <button
        onClick={() => setIsTutorialOpen(true)}
        className="shrink-0 bg-white text-secondary text-xs font-bold px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
      >
        查看教學
      </button>

      {isTutorialOpen &&
        // 訂單彈窗本體帶 scale transform，會成為 fixed 子元素的 containing
        // block，portal 到 body 才能真正覆蓋全螢幕
        createPortal(
          <div
            ref={tutorialRef}
            role="dialog"
            aria-modal="true"
            aria-label="加入手機桌面教學"
            className="fixed inset-0 z-[60] flex items-center justify-center p-2"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsTutorialOpen(false)}
              className="absolute inset-0 bg-primary/90 backdrop-blur-sm"
            />
            <button
              onClick={() => setIsTutorialOpen(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-primary-fixed-dim transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer"
              aria-label="關閉教學"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative"
            >
              <Image
                src={tutorial.src}
                alt={tutorial.alt}
                width={1536}
                height={1024}
                sizes="95vw"
                className="max-h-[85vh] w-auto max-w-[95vw] object-contain rounded-xl"
              />
            </motion.div>
          </div>,
          document.body,
        )}
    </motion.div>
  );
}
