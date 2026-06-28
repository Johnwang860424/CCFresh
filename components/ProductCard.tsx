"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, TrendingDown } from "lucide-react";
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
      <div className="relative aspect-4/3 w-full bg-[#f0f3ff] overflow-hidden">
        {renderBadge()}

        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
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
                  className="w-full h-9 bg-white text-[#0050cc] hover:bg-[#e7eeff] border border-[#cfdaf1] hover:border-[#0050cc] rounded-full text-xs font-bold leading-none cursor-pointer transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm active:scale-95 py-2.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
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
    </div>
  );
}
