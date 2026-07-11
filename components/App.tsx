"use client";

import { useState, useEffect, useMemo, ReactNode } from "react";
import { motion } from "motion/react";
import {
  ShoppingCart,
  ArrowRight,
  MapPin,
  PhoneCall,
  Timer,
} from "lucide-react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import ProductCard from "./ProductCard";
import CheckoutForm from "./CheckoutForm";
import OrderSuccessModal from "./OrderSuccessModal";
import LineFloatButton from "./LineFloatButton";
import {
  Product,
  Category,
  CartItem,
  OrderFormData,
  OrderConfirmation,
} from "../types";
import { calcLineSubtotal } from "../app/lib/promotions";
import { useResource } from "../app/lib/useResource";

const CART_STORAGE_KEY = "cc_fresh_cart";

// 欄數 → 商品格線 class。單欄僅存在於行動版，桌面斷點仍回到多欄呈現。
const GRID_CLASS_BY_COLUMNS: Record<number, string> = {
  1: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto",
  2: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto",
  3: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto",
  4: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto",
};

// 版面排列選項。active 判斷不全是等值比較：行動版的單欄在桌面斷點呈現四欄，
// 所以行動版「雙欄」於任何非單欄值都亮、桌面版「四欄」在 columns === 1 時也亮。
const MOBILE_LAYOUTS = [
  { value: 1, label: "單欄", isActive: (c: number) => c === 1 },
  { value: 2, label: "雙欄", isActive: (c: number) => c !== 1 },
];
const DESKTOP_LAYOUTS = [
  { value: 2, label: "雙欄", isActive: (c: number) => c === 2 },
  { value: 3, label: "三欄", isActive: (c: number) => c === 3 },
  { value: 4, label: "四欄", isActive: (c: number) => c === 4 || c === 1 },
];

// 品牌信賴徽章（三欄區塊）
const TRUST_BADGES = [
  { Icon: Timer, text: "24小時全程低溫冷鏈" },
  { Icon: MapPin, text: "定點交貨安心取" },
  { Icon: PhoneCall, text: "產銷透明食材把關" },
];

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 商品區的載入中／錯誤／空分類共用同一種狀態框
function StatusPanel({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-900 max-w-lg mx-auto">
      <p className="text-slate-400 font-sans text-sm font-medium">{children}</p>
    </div>
  );
}

// 購物車只持久化「商品 id + 數量」，商品快照（價格/名稱/圖片）一律在 render 時
// 依最新商品目錄即時帶入，因此不需要再額外做一次「對帳」邏輯。
interface RawCartItem {
  id: string;
  quantity: number;
}

function persistCart(cart: RawCartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Failed to save cart", e);
  }
}

// 解析 localStorage 內的購物車，並相容舊版（整包 CartItem 含 product 快照）格式。
function parseStoredCart(raw: string): RawCartItem[] {
  const parsed = JSON.parse(raw) as unknown[];
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((entry) => {
    const obj = entry as {
      id?: string;
      quantity?: number;
      product?: { id?: string };
    };
    const id = obj.product?.id ?? obj.id;
    const quantity = Number(obj.quantity);
    return id && Number.isInteger(quantity) && quantity > 0
      ? [{ id, quantity }]
      : [];
  });
}

export default function App() {
  const [rawCart, setRawCart] = useState<RawCartItem[]>([]);
  const {
    data: productsData,
    loading: isProductsLoading,
    error: productsError,
  } = useResource<Product[]>("/api/products", "商品資料載入失敗，請稍後再試");
  const { data: categoriesData } = useResource<Category[]>(
    "/api/categories",
    "分類資料載入失敗，請稍後再試",
  );
  const products = productsData ?? [];
  const categories = categoriesData ?? [];
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<OrderFormData | null>(
    null,
  );
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  );
  const [columns, setColumns] = useState<number>(4);

  const gridClass = GRID_CLASS_BY_COLUMNS[columns];

  const renderLayoutButtons = (layouts: typeof MOBILE_LAYOUTS) =>
    layouts.map(({ value, label, isActive }) => (
      <button
        key={label}
        onClick={() => setColumns(value)}
        className={`py-1 px-3 rounded-lg text-xs font-black transition-all duration-300 font-sans cursor-pointer focus:outline-none ${
          isActive(columns)
            ? "bg-[#0050cc] text-white shadow-md shadow-[#0050cc]/25"
            : "text-slate-400 hover:text-white"
        }`}
      >
        {label}
      </button>
    ));

  // 使用者尚未手動選分類時，預設顯示第一個分類（改為 render 時推導，避免在 effect 內 setState）。
  const activeCategory = selectedCategory || categories[0]?.key || "";

  // 以「id + 數量」搭配最新商品目錄即時組出購物車：找不到的商品（已下架）自動略過，
  // 價格／名稱／圖片一律取最新值——等同於原本的對帳，但改為宣告式推導。
  const cart = useMemo<CartItem[]>(() => {
    const productById = new Map((productsData ?? []).map((p) => [p.id, p]));
    return rawCart.flatMap(({ id, quantity }) => {
      const product = productById.get(id);
      return product ? [{ product, quantity }] : [];
    });
  }, [rawCart, productsData]);


  // Load cart from LocalStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        // 須在掛載後才讀 localStorage，否則 SSR 首屏與 client 會 hydration 不一致。
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRawCart(parseStoredCart(savedCart));
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
  }, []);


  // Save cart to LocalStorage on updates
  const saveCart = (newCart: RawCartItem[]) => {
    setRawCart(newCart);
    persistCart(newCart);
  };

  const handleAddToCart = (product: Product) => {
    const existing = rawCart.find((item) => item.id === product.id);
    const newCart = existing
      ? rawCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      : [...rawCart, { id: product.id, quantity: 1 }];
    saveCart(newCart);
  };

  const handleRemoveOneFromCart = (productId: string) => {
    const existing = rawCart.find((item) => item.id === productId);
    if (!existing) return;

    const newCart =
      existing.quantity <= 1
        ? rawCart.filter((item) => item.id !== productId)
        : rawCart.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          );
    saveCart(newCart);
  };

  const handleRemoveItem = (productId: string) => {
    saveCart(rawCart.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const handleSubmitOrder = (
    formData: OrderFormData,
    orderConfirmation: OrderConfirmation,
  ) => {
    setSubmittedForm(formData);
    setConfirmation(orderConfirmation);
    setIsSuccessModalOpen(true);
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    handleClearCart();
    setSubmittedForm(null);
    setConfirmation(null);
    // Scroll back to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToCatalog = () => scrollToSection("featured-products");
  const scrollToCheckout = () => scrollToSection("checkout-section");

  // Filter listed products based on actively selected category
  const filteredProducts = products.filter(
    (product) => product.category === activeCategory,
  );

  const totalCartPrice = cart.reduce(
    (sum, item) =>
      sum +
      calcLineSubtotal(item.product.promo, item.product.price, item.quantity),
    0,
  );
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-[#0050cc] selection:text-white">
      {/* Navigation Headers */}
      <Navbar
        cart={cart}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setSelectedCategory}
        onCartClick={scrollToCheckout}
      />

      {/* Hero Intro Banner Section */}
      <Hero onCtaClick={scrollToCatalog} />

      {/* Featured Products Showcases ("精選商品") with Dark Charcoal Premium Aesthetics */}
      <section
        id="featured-products"
        className="bg-[#02050c] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-t border-[#00102d]"
      >
        {/* Abstract Ice Grid Overlay for Icy Fresh Feel */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Section Header Title */}
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black font-sans tracking-wide text-white">
              精選商品
            </h2>

            <div className="w-16 h-1 bg-[#0050cc] mx-auto rounded-full" />

            <p className="text-sm text-[#bebfe1] font-medium max-w-xl mx-auto font-sans">
              急速冷凍真空技術，完美鎖定頂級食材最初的新鮮、甜美與精緻口感。
            </p>
          </div>

          {/* Catalog Selection Filters Tab Headers */}
          {(() => {
            // Switch to a horizontal scroll (carousel) layout once there are
            // too many categories to fit comfortably on one centered row.
            const isScrollable = categories.length > 4;
            return (
              <div
                className={`flex gap-2.5 mb-10 mx-auto bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 backdrop-blur-sm ${
                  isScrollable
                    ? "w-fit max-w-full md:max-w-2xl overflow-x-auto snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    : "justify-center flex-wrap max-w-md"
                }`}
              >
                {categories.map((tab) => {
                  const isActive = activeCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedCategory(tab.key)}
                      className={`py-1.5 px-3.5 rounded-lg text-xs font-black transition-all duration-300 font-sans cursor-pointer focus:outline-none ${
                        isScrollable
                          ? "flex-none snap-start whitespace-nowrap"
                          : "flex-1"
                      } ${
                        isActive
                          ? "bg-[#0050cc] text-white shadow-md shadow-[#0050cc]/25"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Column Layout Switcher */}
          <div className="flex justify-end items-center mb-8 max-w-6xl mx-auto px-4 sm:px-0">
            <div className="flex items-center space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 backdrop-blur-sm">
              <span className="text-xs text-slate-400 font-bold px-2.5 select-none font-sans">版面排列：</span>
              
              {/* Mobile Controls */}
              <div className="flex sm:hidden space-x-1">
                {renderLayoutButtons(MOBILE_LAYOUTS)}
              </div>

              {/* Desktop/Tablet Controls */}
              <div className="hidden sm:flex space-x-1">
                {renderLayoutButtons(DESKTOP_LAYOUTS)}
              </div>
            </div>
          </div>

          {/* Product Items Responsive Grid */}
          {isProductsLoading ? (
            <StatusPanel>商品載入中...</StatusPanel>
          ) : productsError ? (
            <StatusPanel>{productsError}</StatusPanel>
          ) : filteredProducts.length > 0 ? (
            <div className={gridClass}>
              {filteredProducts.map((prod) => {
                const item = cart.find((c) => c.product.id === prod.id);
                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    cartItem={item}
                    onAddToCart={handleAddToCart}
                    onRemoveOneFromCart={handleRemoveOneFromCart}
                  />
                );
              })}
            </div>
          ) : (
            <StatusPanel>該分類目前尚無現貨商品</StatusPanel>
          )}

          {/* Floating shopping call-to-action bottom banner once cart is active */}
          {totalCartCount > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-16 max-w-3xl mx-auto bg-slate-900/90 border border-[#dee8ff]/10 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-3 bg-[#0050cc] text-white rounded-xl shadow-lg shadow-[#0050cc]/25">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    已選購 {totalCartCount} 項商品
                  </h4>
                  <p className="text-xs text-slate-400">
                    目前商品計價 NT${" "}
                    <span className="text-white font-mono font-bold text-sm">
                      {totalCartPrice.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={scrollToCheckout}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0050cc] hover:bg-[#0266ff] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>下一步：填寫收件資訊</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Brand Attributes / Trust Badges Section */}
      <section className="bg-white py-12 border-y border-[#e7eeff] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6 text-center">
          {TRUST_BADGES.map(({ Icon, text }) => (
            <div key={text} className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-[#f0f3ff] rounded-full flex items-center justify-center text-[#0050cc] mb-1">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-[#00102d] text-sm font-black font-sans">
                {text}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Checkout Form Container page section */}
      <CheckoutForm
        cart={cart}
        onRemoveItem={handleRemoveItem}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Elegant minimalist footer */}
      <footer className="bg-[#00102d] text-white/50 text-[11px] py-10 text-center border-t border-[#dee8ff]/10 font-medium font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="text-white/85 text-sm font-black font-sans">
            CC 生鮮 - 嚴選產地，鎖住甘甜
          </p>
          <p className="max-w-md mx-auto leading-relaxed">
            © 2026-PRESENT CC 生鮮
          </p>
        </div>
      </footer>

      {/* Floating LINE add-friend button */}
      <LineFloatButton />

      {/* Order success summary overlay modal */}
      {submittedForm && confirmation && (
        <OrderSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleCloseSuccessModal}
          formData={submittedForm}
          confirmation={confirmation}
          cart={cart}
        />
      )}
    </div>
  );
}
