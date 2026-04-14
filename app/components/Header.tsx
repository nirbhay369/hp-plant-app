"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [openLogo, setOpenLogo] = useState(false); // ✅ inside component
  const pathname = usePathname();
const isLoginPage = pathname === "/login";

  return (
    <>
      <div className="w-full bg-white shadow-sm sticky top-0 z-50 border-b">
  <div className="max-w-[1200px] mx-auto px-4 py-3 flex justify-between items-center w-full">
          {/* Logo */}
       <Link
  href={isLoginPage ? "#" : "/"}
  onClick={(e) => {
    if (isLoginPage) e.preventDefault();
  }}
  className={`flex items-center gap-2 sm:gap-3 ${
    isLoginPage ? "cursor-default" : "cursor-pointer"
  }`}
>
            {/* LOGO */}
            <img
              src="/logos.png"
              alt="logo"
              onClick={(e) => {
                e.preventDefault(); // stop navigation
                setOpenLogo(true);
              }}
              className="h-14 sm:h-20 w-auto object-contain cursor-pointer"
            />

            {/* TEXT */}
            <span className="text-lg sm:text-xl font-semibold text-gray-800 whitespace-nowrap">
           HariAkshar Farm
            </span>
          </Link>

          {/* Right text */}
          <div className="hidden md:block text-sm font-medium text-gray-700 tracking-wide border-l border-gray-200 pl-4 relative -top-[4px]">
            <b>H</b>ariprabodham <b>D</b>ham
          </div>

        </div>
      </div>

      {/* ✅ FULLSCREEN LOGO MODAL */}
      {openLogo && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setOpenLogo(false)}
            className="absolute top-5 right-5 text-white text-3xl"
          >
            ✕
          </button>

          {/* IMAGE */}
          <img
            src="/logo.png"
            className="max-w-[90%] max-h-[90%] object-contain"
          />
        </div>
      )}
    </>
  );
} 