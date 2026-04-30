"use client";

import { useRouter, usePathname } from "next/navigation";
import { usePlant } from "../context/PlantContext";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { plantCount } = usePlant();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const status = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(status === "true");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  const links = [
    { href: "/", label: "PLANTS" },
    { href: "/add", label: "ADD PLANT" },
    { href: "/phe", label: "TUHI" },
    { href: "/phe/add", label: "ADD TUHI" },
  ];

  return (
    <div className="w-full bg-[#fdfdfd] border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">

        {/* 🔹 DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <span
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`cursor-pointer text-sm font-medium tracking-widest uppercase pb-1 transition-all ${isActive
                  ? "text-gray-900 border-b border-gray-900"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {link.label}
              </span>
            );
          })}
        </div>

        {/* 🔹 DESKTOP RIGHT (Plant Count & Logout) */}
        <div className="hidden md:flex items-center gap-4">
          <div
            onClick={() => router.push("/report")}
            className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-1.5 text-sm cursor-pointer hover:bg-green-100 transition"
          >
            <span className="font-bold text-green-800">{plantCount}</span>
            <span className="text-green-600 text-xs uppercase tracking-wider">plants</span>
          </div>

          {!isLoggedIn ? (
            <button
              onClick={() => router.push("/login")}
              className="bg-gray-800 text-white px-4 py-1.5 text-sm uppercase tracking-wider hover:bg-black transition"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 text-sm uppercase tracking-wider hover:bg-red-100 transition"
            >
              Logout
            </button>
          )}
        </div>

        {/* 🔹 MOBILE HEADER ROW */}
        <div className="md:hidden flex items-center justify-between w-full">
          {/* Plant count on mobile left */}
          <div
            onClick={() => router.push("/report")}
            className="flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 rounded px-2 py-1 text-xs cursor-pointer"
          >
            <span className="font-bold text-green-800">{plantCount}</span>
            <span className="text-green-600 uppercase tracking-wider">plants</span>
          </div>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-gray-700 hover:text-black"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

      </div>

      {/* 🔹 MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex flex-col items-center bg-[#fdfdfd] border-t border-gray-100 px-4 py-6 gap-6 shadow-inner">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <span
                key={link.href}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push(link.href);
                }}
                className={`cursor-pointer text-sm font-medium tracking-widest uppercase pb-1 transition-all ${isActive
                  ? "text-gray-900 border-b border-gray-900"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {link.label}
              </span>
            );
          })}

          <div className="w-16 h-px bg-gray-200 my-2"></div>

          {!isLoggedIn ? (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push("/login");
              }}
              className="text-sm font-medium tracking-widest uppercase text-gray-700 hover:text-black pb-1"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="text-sm font-medium tracking-widest uppercase text-red-600 hover:text-red-800 pb-1"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  );
}