"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";

interface HeroProps {
  onCtaClick: () => void;
}

export default function Hero({ onCtaClick }: HeroProps) {
  return (
    <div className="relative h-[85vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.webp"
          alt="Premium raw fresh seafood on ice"
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105 filter brightness-75 contrast-105 scale-image"
        />
        {/* Dark Icy Gradient Overlay to ensure maximum text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary/75 to-primary" />
      </div>

      {/* Decorative Frost Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-10">
        <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-blue-300 filter blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-blue-400 filter blur-3xl" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        {/* Decorative Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center space-x-2 bg-secondary-bright/25 backdrop-blur-md px-4 py-1.5 rounded-full border border-secondary-bright/35"
        >
          <span className="w-2 h-2 rounded-full bg-secondary-bright animate-ping" />
          <span className="text-surface-container-high text-xs font-semibold tracking-wider font-sans">
            急凍真鮮 · 日日直送
          </span>
        </motion.div>

        {/* Primary Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-white text-3xl sm:text-5xl md:text-6xl font-black font-sans leading-tight tracking-wide drop-shadow-lg text-center"
        >
          CC 生鮮 - 產地直達，鮮味直送
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-4 sm:mt-6 text-base sm:text-xl text-surface-dim font-medium font-sans max-w-xl text-center leading-relaxed tracking-wider drop-shadow"
        >
          專業低溫宅配，鎖住最初的鮮甜
        </motion.p>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onClick={onCtaClick}
          className="mt-10 px-8 py-3.5 bg-secondary hover:bg-secondary-bright text-white text-base font-bold rounded-full transition-all duration-300 shadow-xl hover:scale-[1.04] focus:ring-4 focus:ring-secondary/40 cursor-pointer flex items-center space-x-2.5 active:scale-95"
        >
          <span>立即選購</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>
      </div>

      {/* Floating hints about Cold Chain safety */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
        <span className="text-xs text-surface-dim/75 font-sans tracking-widest font-medium mb-1">
          SCROLL DOWN
        </span>
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-surface-dim to-transparent animate-pulse" />
      </div>
    </div>
  );
}
