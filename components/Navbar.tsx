"use client";

import { useState } from "react";
import { ShoppingCart, Menu, X, Waves, Compass } from "lucide-react";
import { CartItem } from "../types";

interface NavbarProps {
  cart: CartItem[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  onCartClick: () => void;
}

export default function Navbar({
  cart,
  activeCategory,
  setActiveCategory,
  onCartClick
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const menuItems = [
    { label: "Seafood", key: "seafood", display: "Seafood" },
    { label: "Meat", key: "meat", display: "Meat" },
    { label: "New Arrivals", key: "new", display: "New Arrivals" },
    { label: "Offers", key: "offers", display: "Offers" }
  ];

  const handleNavClick = (key: string) => {
    setActiveCategory(key);
    setMobileMenuOpen(false);
    // Smooth scroll down to main selection if we are on mobile or above
    const el = document.getElementById("featured-products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#e7eeff]/90 backdrop-blur-md border-b border-[#cfdaf1] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Brand */}
          <div 
            onClick={() => {
              setActiveCategory("seafood");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#00102d] rounded-full flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md border border-[#0266ff]/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
              <span className="font-sans text-[10px] leading-tight text-[#f9f7ff] font-bold text-center">CC<br />生鮮</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#00102d] tracking-wide font-sans">CC 生鮮</span>
              <span className="text-[9px] text-[#44474f] tracking-widest font-sans uppercase font-medium -mt-1">Cold Chain Fresh</span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {menuItems.map((item) => {
              const isActive = activeCategory === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`relative py-2 text-sm font-semibold transition-all duration-200 tracking-wide font-sans cursor-pointer focus:outline-none ${
                    isActive 
                      ? "text-[#0050cc] scale-[1.03]" 
                      : "text-[#44474f] hover:text-[#00102d]"
                  }`}
                >
                  {item.display}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0050cc] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onCartClick}
              className="relative p-2.5 rounded-full bg-white hover:bg-[#e7eeff] text-[#00102d] transition-all duration-200 border border-[#dee8ff] hover:border-[#cfdaf1] cursor-pointer shadow-sm group"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ba1a1a] text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md border border-white">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-[#44474f] hover:text-[#00102d] hover:bg-[#f0f3ff] transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#dee8ff] py-3 px-4 space-y-2 shadow-inner">
          {menuItems.map((item) => {
            const isActive = activeCategory === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#e7eeff] text-[#0050cc]"
                    : "text-[#44474f] hover:bg-[#f9f9ff] hover:text-[#00102d]"
                }`}
              >
                {item.display}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
