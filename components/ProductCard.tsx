"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, TrendingDown, ShoppingCart, X, ZoomIn } from "lucide-react";
import { Product, CartItem } from "../types";

interface ProductCardProps {
  product: Product;
  cartItem: CartItem | undefined;
  onAddToCart: (product: Product) => void;
  onRemoveOneFromCart: (productId: string) => void;
}

export default function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onRemoveOneFromCart,
}: ProductCardProps) {
  const quantity = cartItem ? cartItem.quantity : 0;
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsZoomed(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isZoomed]);

  // Promo badge (only rendered when the product carries a promo summary)
  const renderBadge = () => {
    if (!product.badge) return null;

    return (
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider flex items-center space-x-1 shadow-md bg-[#ef6c00] text-white">
        <TrendingDown className="w-3.5 h-3.5" />
        <span>{product.badge}</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-xl border border-[#dee8ff] overflow-hidden shadow-sm hover:shadow-xl hover:border-[#cfdaf1] transition-all duration-300 flex flex-col group relative">
      {/* Product Image Stage */}
      <div 
        onClick={() => setIsZoomed(true)}
        className="relative aspect-[3/4] w-full bg-[#f0f3ff] overflow-hidden cursor-zoom-in group/image"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsZoomed(true);
            e.preventDefault();
          }
        }}
        aria-label={`放大查看 ${product.name} 圖片`}
      >
        {renderBadge()}

        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Zoom Overlay Hover Effect */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
          <div className="bg-white/95 text-[#00102d] rounded-full p-2.5 shadow-lg transform scale-90 group-hover/image:scale-100 transition-transform duration-300 flex items-center justify-center">
            <ZoomIn className="w-5 h-5" />
          </div>
        </div>

        {/* Subtle ice shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <h3 className="text-[#00102d] text-base font-bold font-sans tracking-wide mb-1 leading-snug group-hover:text-[#0050cc] transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-[#44474f] font-sans font-medium mb-1">
          {product.weight}
        </p>

        {product.description && (
          <p className="text-xs text-[#5c5f6b] font-sans leading-relaxed mb-4 flex-1">
            {product.description}
          </p>
        )}

        {/* Pricing & Cart Action Block */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-slate-100 gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#44474f] uppercase font-bold tracking-wider -mb-1">
              會員價
            </span>
            <span className="text-lg font-black text-[#0050cc] font-sans">
              NT$ {product.price.toLocaleString()}
            </span>
          </div>

          {/* Animating Action Block with Quick Add Stepper */}
          <div className="h-10 w-full sm:w-32 flex items-center justify-start sm:justify-end">
            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onAddToCart(product)}
                  className="w-full h-9 bg-[#ef6c00] text-white hover:bg-[#d84315] rounded-full text-xs font-bold leading-none cursor-pointer transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm active:scale-95 py-2.5 px-3"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>加入購物車</span>
                </motion.button>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between w-full h-9 bg-[#f0f3ff] border border-[#cfdaf1] rounded-full px-1 py-0.5 overflow-hidden shadow-inner"
                >
                  {/* Minus button */}
                  <button
                    onClick={() => onRemoveOneFromCart(product.id)}
                    className="w-7 h-7 bg-white hover:bg-[#dee8ff] text-[#00102d] rounded-full flex items-center justify-center focus:outline-none transition-colors border border-slate-100 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 text-[#44474f] hover:text-[#00102d]" />
                  </button>

                  {/* Quantity Display */}
                  <span className="font-bold text-sm text-[#00102d] select-none text-center min-w-6 px-1">
                    {quantity}
                  </span>

                  {/* Plus button */}
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-7 h-7 bg-[#0050cc] hover:bg-[#0266ff] text-white rounded-full flex items-center justify-center focus:outline-none transition-all cursor-pointer shadow-sm active:scale-95"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Lightbox / Image Zoom Overlay */}
      <AnimatePresence>
        {isZoomed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomed(false)}
              className="absolute inset-0 bg-[#00102d]/90 backdrop-blur-md cursor-zoom-out"
            />

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center z-10 pointer-events-none"
            >
              {/* Image Frame */}
              <div className="relative w-full h-[60vh] sm:h-[70vh] pointer-events-auto rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#02050c]/50">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1280px) 95vw, 1200px"
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 bg-[#00102d]/80 hover:bg-[#ef6c00] text-white rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 shadow-lg border border-white/10 cursor-pointer pointer-events-auto active:scale-95 flex items-center justify-center"
                aria-label="Close image zoom"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Info panel below the lightbox */}
              <div className="mt-4 px-6 py-3 bg-[#00102d]/80 backdrop-blur-sm rounded-xl border border-white/10 text-center max-w-md pointer-events-auto shadow-xl flex flex-col items-center">
                <p className="text-white text-sm font-black tracking-wide font-sans">
                  {product.name}
                </p>
                {product.weight && (
                  <p className="text-[11px] text-[#bebfe1] font-semibold font-sans mt-1">
                    {product.weight}
                  </p>
                )}
                <p className="text-xs text-[#ef6c00] font-black font-sans mt-1">
                  NT$ {product.price.toLocaleString()}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
