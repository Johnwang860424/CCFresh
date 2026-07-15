"use client";

import { motion } from "motion/react";

const LINE_ADD_FRIEND_URL = "https://line.me/R/ti/p/@cc8888";

// lifted：底部結帳列出現時上移，避免被蓋住
export default function LineFloatButton({ lifted = false }: { lifted?: boolean }) {
  return (
    <motion.a
      href={LINE_ADD_FRIEND_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="加入 LINE 好友"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed right-5 z-50 flex items-center gap-2 rounded-full bg-[#06C755] px-4 py-3 text-white shadow-lg transition-all hover:bg-[#05b34c] sm:right-6 ${
        lifted ? "bottom-24" : "bottom-5 sm:bottom-6"
      }`}
    >
      {/* LINE 官方圖示 */}
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0 fill-current"
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 5.69 2 10.23c0 4.07 3.55 7.48 8.35 8.12.32.07.77.21.88.49.1.25.07.64.03.89l-.14.85c-.04.25-.2.99.87.54 1.07-.45 5.76-3.39 7.86-5.81 1.45-1.59 2.15-3.21 2.15-5.07C22 5.69 17.52 2 12 2zM8.13 12.85a.2.2 0 0 1-.2.2H6.07a.2.2 0 0 1-.2-.2V9.35c0-.11.09-.2.2-.2h.5c.11 0 .2.09.2.2v2.8h1.16c.11 0 .2.09.2.2v.5zm1.4 0a.2.2 0 0 1-.2.2h-.5a.2.2 0 0 1-.2-.2V9.35c0-.11.09-.2.2-.2h.5c.11 0 .2.09.2.2v3.5zm3.92 0a.2.2 0 0 1-.2.2h-.5a.2.2 0 0 1-.16-.08l-1.6-2.17v2.05a.2.2 0 0 1-.2.2h-.5a.2.2 0 0 1-.2-.2V9.35c0-.11.09-.2.2-.2h.5c.06 0 .12.03.16.08l1.6 2.17V9.35c0-.11.09-.2.2-.2h.5c.11 0 .2.09.2.2v3.5zm3.15-3a.2.2 0 0 1-.2.2h-1.16v.66h1.16c.11 0 .2.09.2.2v.5a.2.2 0 0 1-.2.2h-1.16v.65h1.16c.11 0 .2.09.2.2v.5a.2.2 0 0 1-.2.2h-1.86a.2.2 0 0 1-.2-.2V9.35c0-.11.09-.2.2-.2h1.86c.11 0 .2.09.2.2v.5z" />
      </svg>
      <span className="pr-1 text-sm font-black">加 LINE 好友</span>
    </motion.a>
  );
}
