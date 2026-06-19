"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShoppingCart, ArrowRight, Sparkles, MapPin, PhoneCall, Timer } from "lucide-react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import ProductCard from "./ProductCard";
import CheckoutForm from "./CheckoutForm";
import OrderSuccessModal from "./OrderSuccessModal";
import { PRODUCTS } from "../data";
import { Product, CartItem, OrderFormData } from "../types";

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("seafood");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<OrderFormData | null>(null);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cc_fresh_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
  }, []);

  // Save cart to LocalStorage on updates
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("cc_fresh_cart", JSON.stringify(newCart));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  };

  const handleAddToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    let newCart: CartItem[];
    if (existing) {
      newCart = cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { product, quantity: 1 }];
    }
    saveCart(newCart);
  };

  const handleRemoveOneFromCart = (productId: string) => {
    const existing = cart.find((item) => item.product.id === productId);
    if (!existing) return;

    let newCart: CartItem[];
    if (existing.quantity <= 1) {
      newCart = cart.filter((item) => item.product.id !== productId);
    } else {
      newCart = cart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    }
    saveCart(newCart);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const handleSubmitOrder = (formData: OrderFormData) => {
    setSubmittedForm(formData);
    setIsSuccessModalOpen(true);
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    handleClearCart();
    setSubmittedForm(null);
    // Scroll back to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scroll to catalog section helper
  const scrollToCatalog = () => {
    const el = document.getElementById("featured-products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll to checkout section helper
  const scrollToCheckout = () => {
    const el = document.getElementById("checkout-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Filter listed products based on actively selected category
  const filteredProducts = PRODUCTS.filter(
    (product) => product.category === activeCategory
  );

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-[#0050cc] selection:text-white">
      {/* Navigation Headers */}
      <Navbar
        cart={cart}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-1.5 bg-[#0050cc]/20 border border-[#0266ff]/35 px-3 py-1 rounded-full text-xs font-bold text-[#b0c6f9] tracking-wider uppercase"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>COLD CHAIN RESERVE</span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-black font-sans tracking-wide text-white">
              精選商品
            </h2>

            <div className="w-16 h-1 bg-[#0050cc] mx-auto rounded-full" />

            <p className="text-sm text-[#bebfe1] font-medium max-w-xl mx-auto font-sans">
              急速冷凍真空技術，完美鎖定頂級食材最初的新鮮、甜美與精緻口感。
            </p>
          </div>

          {/* Catalog Selection Filters Tab Headers (Duplicate for visual focus on desktop) */}
          <div className="flex justify-center flex-wrap gap-2.5 mb-10 max-w-md mx-auto bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 backdrop-blur-sm">
            {[
              { key: "seafood", name: "頂級海鮮" },
              { key: "meat", name: "極品肉品" },
              { key: "new", name: "新品上架" },
              { key: "offers", name: "限時超值" }
            ].map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`flex-1 py-1.5 px-3.5 rounded-lg text-xs font-black transition-all duration-300 font-sans cursor-pointer focus:outline-none ${isActive
                    ? "bg-[#0050cc] text-white shadow-md shadow-[#0050cc]/25"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Product Items Responsive Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
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
            <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-900 max-w-lg mx-auto">
              <p className="text-slate-400 font-sans text-sm font-medium">該分類目前尚無現貨商品</p>
            </div>
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
                  <h4 className="text-sm font-black text-white">已選購 {totalCartCount} 項神農級急凍食材</h4>
                  <p className="text-xs text-slate-400">目前商品計價 NT$ <span className="text-white font-mono font-bold text-sm">{totalCartPrice.toLocaleString()}</span></p>
                </div>
              </div>

              <button
                onClick={scrollToCheckout}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0050cc] hover:bg-[#0266ff] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>下一步：填寫快遞收件資訊</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Brand Attributes / Trust Badges Section */}
      <section className="bg-white py-12 border-y border-[#e7eeff] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-[#f0f3ff] rounded-full flex items-center justify-center text-[#0050cc] mb-1">
              <Timer className="w-6 h-6" />
            </div>
            <h3 className="text-[#00102d] text-sm font-black font-sans">24小時全程低溫冷鏈</h3>
            <p className="text-xs text-slate-500 max-w-xs font-sans leading-relaxed">專業急凍庫、雙溫控冷凍配送車，保證運送途中不失溫、不退冰失水。</p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-[#f0f3ff] rounded-full flex items-center justify-center text-[#0050cc] mb-1">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-[#00102d] text-sm font-black font-sans">定點交貨安心取</h3>
            <p className="text-xs text-slate-500 max-w-xs font-sans leading-relaxed">全台設立數十處高級大理石自提定點櫃與低溫取貨站，免運無拘束。</p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-[#f0f3ff] rounded-full flex items-center justify-center text-[#0050cc] mb-1">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-[#00102d] text-sm font-black font-sans">產銷透明食材把關</h3>
            <p className="text-xs text-slate-500 max-w-xs font-sans leading-relaxed">每批進口海鮮肉品均具備完備的 FDA 進口食品檢疫與無重金屬多項合規證書。</p>
          </div>
        </div>
      </section>

      {/* Checkout Form Container page section */}
      <CheckoutForm
        cart={cart}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Elegant minimalist footer */}
      <footer className="bg-[#00102d] text-white/50 text-[11px] py-10 text-center border-t border-[#dee8ff]/10 font-medium font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="text-white/85 text-sm font-black font-sans">CC 生鮮 - 嚴選產地，鎖住甘甜</p>
          <p className="max-w-md mx-auto leading-relaxed">
            客服專線：0800-478-855 (每日 09:00 - 21:00) ·
            服務信箱：support@ccfresh.com.tw <br />
            © 2026-PRESENT CC FRESH LTD. CO.
          </p>
          <div className="pt-2 flex justify-center space-x-4">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">運送條款</a>
            <span>·</span>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">隱私權政策</a>
            <span>·</span>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">退換貨須知</a>
          </div>
        </div>
      </footer>

      {/* Simulated cloud-sync and order success summary overlay modal */}
      {submittedForm && (
        <OrderSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleCloseSuccessModal}
          formData={submittedForm}
          cart={cart}
        />
      )}
    </div>
  );
}
