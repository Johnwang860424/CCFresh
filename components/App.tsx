"use client";

import { useState, useEffect, useMemo, useRef, ReactNode } from "react";
import { motion, MotionConfig, useScroll } from "motion/react";
import {
  ShoppingCart,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Timer,
} from "lucide-react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import ProductCard from "./ProductCard";
import CheckoutForm from "./CheckoutForm";
import OrderLookup from "./OrderLookup";
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
import {
  CART_STORAGE_KEY,
  changeCartQuantity,
  hydrateCart,
  parseStoredCart,
  type StoredCartItem,
} from "../app/domain/cart";

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

// 信賴徽章＝食材旅程時間軸：源頭 → 運送 → 交付（順序即資訊，勿隨意調換）。
// stage 為溫度微標：連接線由暖（產地常溫）漸變到冰藍（-18°C 冷鏈），線本身即品牌故事。
const TRUST_BADGES = [
  {
    Icon: ShieldCheck,
    text: "產銷透明食材把關",
    detail: "產地直送，來源看得見",
    stage: { label: "產地", color: "text-promo" },
  },
  {
    Icon: Timer,
    text: "24小時全程低溫冷鏈",
    detail: "-18°C 急凍鎖住鮮甜",
    stage: { label: "-18°C", color: "text-secondary-bright" },
  },
  {
    Icon: MapPin,
    text: "定點交貨安心取",
    detail: "社區取貨點，交貨安心",
    stage: { label: "保冷交付", color: "text-secondary" },
  },
];

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 商品區的載入中／錯誤／空分類共用同一種狀態框
function StatusPanel({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-surface-container-high max-w-lg mx-auto">
      <p className="text-on-surface-variant font-sans text-sm font-medium">{children}</p>
    </div>
  );
}

// 購物車只持久化「商品 id + 數量」，商品快照（價格/名稱/圖片）一律在 render 時
// 依最新商品目錄即時帶入，因此不需要再額外做一次「對帳」邏輯。
function persistCart(cart: StoredCartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Failed to save cart", e);
  }
}

export default function App() {
  const [rawCart, setRawCart] = useState<StoredCartItem[]>([]);
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
  const [isCheckoutInView, setIsCheckoutInView] = useState(false);

  // 信賴徽章時間軸：連接線隨捲動進度「畫」出來（0→1 對應區塊進入視野的過程）
  const trustRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: trustProgress } = useScroll({
    target: trustRef,
    offset: ["start 0.85", "end 0.55"],
  });

  // 結帳區進入視野時隱藏底部結帳列，避免蓋住表單
  useEffect(() => {
    const el = document.getElementById("checkout-section");
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setIsCheckoutInView(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const gridClass = GRID_CLASS_BY_COLUMNS[columns];

  const renderLayoutButtons = (layouts: typeof MOBILE_LAYOUTS) =>
    layouts.map(({ value, label, isActive }) => (
      <button
        key={label}
        onClick={() => setColumns(value)}
        className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all duration-300 font-sans cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 ${
          isActive(columns)
            ? "bg-secondary text-white"
            : "text-on-surface-variant hover:text-primary"
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
    return hydrateCart(rawCart, productsData ?? []);
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
  const saveCart = (newCart: StoredCartItem[]) => {
    setRawCart(newCart);
    persistCart(newCart);
  };

  const handleAddToCart = (product: Product) => {
    saveCart(changeCartQuantity(rawCart, product.id, 1));
  };

  const handleRemoveOneFromCart = (productId: string) => {
    saveCart(changeCartQuantity(rawCart, productId, -1));
  };

  const handleRemoveItem = (productId: string) => {
    saveCart(rawCart.filter((item) => item.id !== productId));
  };

  // 結帳摘要的 −/＋：歸零即移除、庫存 cap 都由 domain 的既有邏輯處理
  const handleChangeQuantity = (productId: string, delta: number) => {
    saveCart(changeCartQuantity(rawCart, productId, delta));
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
  const showCartBar = totalCartCount > 0 && !isCheckoutInView;

  return (
    // MotionConfig reducedMotion="user"：系統開啟「減少動態效果」時停用全站 motion 動畫
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen flex flex-col bg-surface selection:bg-secondary selection:text-white">
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
        className="bg-surface-container py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-t border-surface-dim"
      >
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Section Header Title */}
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wide text-primary">
              精選商品
            </h2>

            <div className="w-16 h-1 bg-secondary mx-auto rounded-full" />

            <p className="text-sm text-on-surface-variant font-medium max-w-xl mx-auto font-sans">
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
                className={`flex gap-2.5 mb-10 mx-auto bg-white p-1.5 rounded-xl border border-surface-container-high shadow-[0_4px_20px_rgba(10,37,78,0.05)] ${
                  isScrollable
                    ? "w-fit max-w-full md:max-w-2xl overflow-x-auto snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] sm:[mask-image:none]"
                    : "justify-center flex-wrap max-w-md"
                }`}
              >
                {categories.map((tab) => {
                  const isActive = activeCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedCategory(tab.key)}
                      className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all duration-300 font-sans cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 ${
                        isScrollable
                          ? "flex-none snap-start whitespace-nowrap"
                          : "flex-1"
                      } ${
                        isActive
                          ? "bg-secondary text-white"
                          : "text-on-surface-variant hover:text-primary"
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
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-surface-container-high shadow-[0_4px_20px_rgba(10,37,78,0.05)]">
              <span className="text-xs text-on-surface-variant font-bold px-2.5 select-none font-sans">版面排列：</span>
              
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
            <div className={gridClass} aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-surface-container-high overflow-hidden animate-pulse motion-reduce:animate-none"
                >
                  <div className="aspect-square bg-surface-container" />
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="h-4 w-3/4 rounded bg-surface-container" />
                    <div className="h-3 w-1/3 rounded bg-surface-container-low" />
                    <div className="h-3 w-full rounded bg-surface-container-low" />
                    <div className="h-6 w-1/2 rounded bg-surface-container mt-3" />
                  </div>
                </div>
              ))}
            </div>
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

        </div>
      </section>

      {/* Brand Attributes / Trust Badges：冷鏈履歷時間軸（手機直式、桌機橫式） */}
      <section className="bg-white py-14 border-y border-surface-container px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-lg sm:text-xl font-bold text-primary font-sans mb-10">
            產地到餐桌，全程低溫
          </h2>
          <div ref={trustRef} className="relative">
            {/* 溫度漸層連接線：暖橘（產地）→ 冰藍（-18°C 冷鏈交付），隨捲動進度畫出；
                icon 圓底加 ring 蓋住穿過的線段。手機為置中直式、桌機為橫式。 */}
            <motion.div
              aria-hidden="true"
              style={{ scaleX: trustProgress }}
              className="hidden md:block absolute top-6 left-[16.666%] right-[16.666%] h-0.5 rounded-full bg-gradient-to-r from-promo via-secondary-bright to-secondary origin-left"
            />
            <motion.div
              aria-hidden="true"
              style={{ scaleY: trustProgress }}
              className="md:hidden absolute left-[calc(50%-1px)] top-6 bottom-6 w-0.5 rounded-full bg-gradient-to-b from-promo via-secondary-bright to-secondary origin-top"
            />
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
              {TRUST_BADGES.map(({ Icon, text, detail, stage }, index) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: index * 0.18, duration: 0.45 }}
                  className="relative flex flex-col items-center text-center gap-2"
                >
                  <div className="w-12 h-12 shrink-0 bg-surface-container-low rounded-full flex items-center justify-center text-secondary ring-4 ring-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="bg-white px-2 rounded">
                    <span
                      className={`block text-xs font-semibold tracking-widest font-sans ${stage.color}`}
                    >
                      {stage.label}
                    </span>
                    <h3 className="text-primary text-sm font-semibold font-sans mt-0.5">
                      {text}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {detail}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Checkout Form Container page section */}
      <CheckoutForm
        cart={cart}
        onRemoveItem={handleRemoveItem}
        onChangeQuantity={handleChangeQuantity}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Order lookup by phone section */}
      <OrderLookup />

      {/* Elegant minimalist footer */}
      <footer className="bg-primary text-white/50 text-xs py-10 text-center border-t border-white/10 font-medium font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="text-white/85 text-sm font-semibold font-sans">
            CC 生鮮 - 嚴選產地，鎖住甘甜
          </p>
          <p className="max-w-md mx-auto leading-relaxed">
            © 2026-PRESENT CC 生鮮
          </p>
        </div>
      </footer>

      {/* 固定底部結帳列：購物車有商品且結帳區不在視野內時顯示 */}
      {showCartBar && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-container-high px-4 py-3 shadow-[0_-4px_20px_rgba(10,37,78,0.08)]"
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-secondary text-white rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary">
                  已選購 {totalCartCount} 項商品
                </h4>
                <p className="text-xs text-on-surface-variant">
                  商品小計 NT${" "}
                  <span className="text-primary font-mono font-bold text-sm">
                    {totalCartPrice.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={scrollToCheckout}
              className="shrink-0 px-5 py-2.5 bg-secondary hover:bg-secondary-bright text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>前往結帳</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Floating LINE add-friend button（結帳列出現時上移避開） */}
      <LineFloatButton lifted={showCartBar} />

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
    </MotionConfig>
  );
}
