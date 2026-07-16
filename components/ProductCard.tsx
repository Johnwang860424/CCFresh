"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, TrendingDown, ShoppingCart, X, ZoomIn, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, CartItem } from "../types";
import { resolveSwipe } from "../app/lib/swipe";
import { useFocusTrap } from "../app/lib/useFocusTrap";

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
  // 售完（stock === 0）不可加入購物車；有限庫存達剩餘量時「+」停用。
  const isSoldOut = product.stock === 0;
  const isMaxReached = product.stock !== null && quantity >= product.stock;
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLargeImageLoading, setIsLargeImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(lightboxRef, isZoomed);

  // 卡片輪播換圖（與箭頭鈕同邏輯，供觸控滑動共用）
  const stepCardImage = (delta: 1 | -1) => {
    setCurrentImageIndex(
      (prev) =>
        (prev + delta + product.images.length) % product.images.length,
    );
  };

  // 換圖時開 loading spinner 由各事件處理器負責：同一張圖 src 不變、
  // onLoad 不會再觸發，所以只有真的換圖才能重置 spinner，否則會卡住。
  const showZoomedImage = (index: number) => {
    if (index !== zoomedImageIndex) setIsLargeImageLoading(true);
    setZoomedImageIndex(index);
  };

  // 鍵盤處理器閉包內的 zoomedImageIndex 可能過期，改用 functional updater 循環換圖
  const stepZoomedImage = useCallback(
    (delta: 1 | -1) => {
      if (product.images.length > 1) setIsLargeImageLoading(true);
      setZoomedImageIndex(
        (prev) =>
          (prev + delta + product.images.length) % product.images.length,
      );
    },
    [product.images.length],
  );

  // 放大檢視關閉即卸載、重開必重掛 Image（onLoad 必再觸發），開啟時一律重置 spinner
  const openZoom = (index: number) => {
    setIsLargeImageLoading(true);
    setZoomedImageIndex(index);
    setIsZoomed(true);
  };

  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsZoomed(false);
        } else if (e.key === "ArrowLeft") {
          stepZoomedImage(-1);
        } else if (e.key === "ArrowRight") {
          stepZoomedImage(1);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isZoomed, stepZoomedImage]);

  // Promo badge (only rendered when the product carries a promo summary)
  const renderBadge = () => {
    if (!product.badge) return null;

    return (
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider flex items-center space-x-1 shadow-md bg-promo text-white">
        <TrendingDown className="w-3.5 h-3.5" />
        <span>{product.badge}</span>
      </div>
    );
  };

  return (
    // 已加入購物車的卡片以品牌藍外框標示選取狀態
    <div
      className={`w-full h-full bg-white even:bg-surface-container-low rounded-xl border overflow-hidden shadow-sm hover:shadow-[0_4px_20px_rgba(10,37,78,0.1)] transition-all duration-300 flex flex-col group relative ${
        quantity > 0
          ? "border-secondary ring-1 ring-secondary"
          : "border-surface-container-high"
      }`}
    >
      {/* Product Image Stage */}
      <div
        onClick={() => openZoom(currentImageIndex)}
        className="relative aspect-square w-full bg-surface-container-low overflow-hidden cursor-zoom-in group/image"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            openZoom(currentImageIndex);
            e.preventDefault();
          }
        }}
        aria-label={`放大查看 ${product.name} 圖片`}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (product.images.length <= 1) return;
          const dir = resolveSwipe(
            touchStartX.current,
            e.changedTouches[0].clientX,
          );
          if (dir === "left") stepCardImage(1);
          else if (dir === "right") stepCardImage(-1);
        }}
      >
        {renderBadge()}

        {/* 售完遮罩：使用冰霜毛玻璃質感，並讓內部的「售完」徽章有精緻感 */}
        {isSoldOut && (
          <div className="absolute inset-0 z-10 bg-white/30 backdrop-blur-[3px] border border-white/10 flex items-center justify-center pointer-events-none">
            <span className="px-5 py-2 rounded-full bg-primary/90 text-white text-xs font-semibold tracking-[0.2em] shadow-lg border border-white/20">
              售完
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={product.images[currentImageIndex] || "/placeholder.jpg"}
              alt={`${product.name} - 圖片 ${currentImageIndex + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                isSoldOut ? "grayscale-[45%] brightness-[92%] opacity-75" : ""
              }`}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        {/* Carousel controls inside card if multiple images */}
        {product.images && product.images.length > 1 && (
          <>
            {/* Left Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) =>
                  prev === 0 ? product.images.length - 1 : prev - 1
                );
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/70 hover:bg-white/95 text-on-surface backdrop-blur-sm shadow-md transition-all flex items-center justify-center opacity-0 group-hover/image:opacity-100 active:scale-90 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Right Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) =>
                  prev === product.images.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/70 hover:bg-white/95 text-on-surface backdrop-blur-sm shadow-md transition-all flex items-center justify-center opacity-0 group-hover/image:opacity-100 active:scale-90 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Indicator dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 bg-black/20 backdrop-blur-sm py-1 px-2 rounded-full">
              {product.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentImageIndex
                      ? "w-3 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Zoom Overlay Hover Effect - Only show zoom indicator if NOT sold out */}
        {!isSoldOut && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-white/95 text-primary rounded-full p-2.5 shadow-lg transform scale-90 group-hover/image:scale-100 transition-transform duration-300 flex items-center justify-center pointer-events-auto">
              <ZoomIn className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className={`p-4 sm:p-5 flex-1 flex flex-col transition-opacity duration-300 ${isSoldOut ? "opacity-65" : "opacity-100"}`}>
        <h3 className="text-on-surface text-base font-semibold font-sans tracking-wide mb-1 leading-snug">
          {product.name}
        </h3>

        <p className="text-xs text-on-surface-variant font-sans mb-1">
          {product.weight}
        </p>

        {product.description && (
          <p className="text-sm text-on-surface-variant font-sans leading-relaxed mb-4 flex-1 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Pricing & Cart Action Block */}
        {/* flex-wrap：卡片夠寬時價格與按鈕同列，太窄時按鈕整顆掉到下一行，價格永不換行 */}
        <div className="mt-auto flex flex-wrap items-center justify-between pt-2 border-t border-surface-container-low gap-2">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-xl font-bold text-secondary font-sans">
              NT$ {product.price.toLocaleString()}
            </span>
          </div>

          {/* Animating Action Block with Quick Add Stepper */}
          <div className="h-10 flex-1 min-w-32 flex items-center">
            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onAddToCart(product)}
                  disabled={isSoldOut}
                  className={`w-full h-9 rounded-full text-xs font-bold leading-none transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm py-2.5 px-3 ${
                    isSoldOut
                      ? "bg-surface-container-low text-on-surface-variant border border-surface-container-high cursor-not-allowed"
                      : "bg-promo text-white hover:bg-promo-bright cursor-pointer active:scale-95"
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isSoldOut ? "已售完" : "加入購物車"}</span>
                </motion.button>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between w-full h-9 bg-surface-container-low border border-surface-dim rounded-full px-1 py-0.5 overflow-hidden shadow-inner"
                >
                  {/* Minus button */}
                  <button
                    onClick={() => onRemoveOneFromCart(product.id)}
                    className="w-7 h-7 bg-white hover:bg-surface-container-high text-primary rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors border border-surface-container-low cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 text-on-surface-variant hover:text-primary" />
                  </button>

                  {/* Quantity Display */}
                  <span className="font-bold text-sm text-on-surface select-none text-center min-w-6 px-1">
                    {quantity}
                  </span>

                  {/* Plus button（達剩餘庫存量即停用） */}
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={isMaxReached}
                    className={`w-7 h-7 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 transition-all shadow-sm ${
                      isMaxReached
                        ? "bg-surface-dim text-on-surface-variant cursor-not-allowed"
                        : "bg-secondary hover:bg-secondary-bright text-white cursor-pointer active:scale-95"
                    }`}
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
          <div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} 圖片放大檢視`}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop overlay with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomed(false)}
              className="absolute inset-0 bg-primary/90 backdrop-blur-md cursor-zoom-out"
            />

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10 pointer-events-none"
            >
              {/* Image Frame */}
              <div
                className="relative w-full h-[55vh] sm:h-[65vh] pointer-events-auto rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-primary/60 flex items-center justify-center"
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  if (product.images.length <= 1) return;
                  const dir = resolveSwipe(
                    touchStartX.current,
                    e.changedTouches[0].clientX,
                  );
                  if (dir === "left") stepZoomedImage(1);
                  else if (dir === "right") stepZoomedImage(-1);
                }}
              >
                {isLargeImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/30 backdrop-blur-sm z-10">
                    <Loader2 className="w-10 h-10 text-white/80 animate-spin" />
                  </div>
                )}
                <Image
                  src={product.images[zoomedImageIndex] || "/placeholder.jpg"}
                  alt={`${product.name} - 放大圖片 ${zoomedImageIndex + 1}`}
                  fill
                  sizes="(max-width: 1280px) 95vw, 1200px"
                  className={`object-contain transition-opacity duration-300 ${
                    isLargeImageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  referrerPolicy="no-referrer"
                  priority
                  onLoad={() => setIsLargeImageLoading(false)}
                />

                {/* Lightbox navigation buttons if multiple images */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => stepZoomedImage(-1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-secondary text-white rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 shadow-lg border border-white/10 cursor-pointer active:scale-95 flex items-center justify-center"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      onClick={() => stepZoomedImage(1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-secondary text-white rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 shadow-lg border border-white/10 cursor-pointer active:scale-95 flex items-center justify-center"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 bg-primary/80 hover:bg-secondary text-white rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 shadow-lg border border-white/10 cursor-pointer pointer-events-auto active:scale-95 flex items-center justify-center"
                aria-label="Close image zoom"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Thumbnail Strip inside Lightbox */}
              {product.images && product.images.length > 1 && (
                <div className="mt-4 flex space-x-2 overflow-x-auto py-1 px-2 max-w-full pointer-events-auto">
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => showZoomedImage(idx)}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all active:scale-95 flex-shrink-0 bg-primary ${
                        idx === zoomedImageIndex
                          ? "border-secondary-bright scale-105 shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 48px, 56px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Info panel below the lightbox */}
              <div className="mt-4 px-6 py-3 bg-primary/80 backdrop-blur-sm rounded-xl border border-white/10 text-center max-w-md pointer-events-auto shadow-xl flex flex-col items-center">
                <p className="text-white text-sm font-semibold tracking-wide font-sans">
                  {product.name}
                </p>
                {product.weight && (
                  <p className="text-xs text-surface-dim font-semibold font-sans mt-1">
                    {product.weight}
                  </p>
                )}
                <p className="text-xs text-white font-bold font-sans mt-1">
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
