"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";
import { CartItem, Category } from "../types";

interface NavbarProps {
  cart: CartItem[];
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  onCartClick: () => void;
}

export default function Navbar({
  cart,
  categories,
  activeCategory,
  setActiveCategory,
  onCartClick,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleNavClick = (key: string) => {
    setActiveCategory(key);
    setMobileMenuOpen(false);
    // Smooth scroll down to main selection if we are on mobile or above
    const el = document.getElementById("featured-products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLookupClick = () => {
    setMobileMenuOpen(false);
    document
      .getElementById("order-lookup")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface-container/90 backdrop-blur-md border-b border-surface-dim transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Brand */}
          <div
            onClick={() => {
              setActiveCategory(categories[0]?.key || "");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <Image
              src="/logo.jpg"
              alt="CC 生鮮"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover shadow-md border border-secondary-bright/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-6"
              priority
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary tracking-wide font-sans">
                CC 生鮮
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {categories.map((item) => {
              const isActive = activeCategory === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`relative py-2 text-sm font-semibold transition-all duration-200 tracking-wide font-sans cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 rounded ${
                    isActive
                      ? "text-secondary scale-[1.03]"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
                  )}
                </button>
              );
            })}

            {/* 查詢訂單：捲動到查詢區塊，非分類、無 active 狀態 */}
            <button
              onClick={handleLookupClick}
              className="relative py-2 text-sm font-semibold transition-all duration-200 tracking-wide font-sans cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 rounded text-on-surface-variant hover:text-primary"
            >
              查詢/修改訂單
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onCartClick}
              className="relative p-2.5 rounded-full bg-white hover:bg-surface-container text-primary transition-all duration-200 border border-surface-container-high hover:border-surface-dim cursor-pointer shadow-sm group"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-md border border-white">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-surface-container-high py-3 px-4 space-y-2 shadow-inner">
          {categories.map((item) => {
            const isActive = activeCategory === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-surface-container text-secondary"
                    : "text-on-surface-variant hover:bg-surface hover:text-primary"
                }`}
              >
                {item.name}
              </button>
            );
          })}

          {/* 查詢訂單：捲動到查詢區塊並收合選單 */}
          <button
            onClick={handleLookupClick}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all text-on-surface-variant hover:bg-surface hover:text-primary"
          >
            查詢/修改訂單
          </button>
        </div>
      )}
    </nav>
  );
}
