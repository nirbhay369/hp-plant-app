"use client";



import "./globals.css";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import { PlantProvider } from "./context/PlantContext";
import { usePathname } from "next/navigation";



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbar = pathname === "/login";

  

  return (
    <html lang="en" className="bg-[#eef5f0]">
      <body className="min-h-screen bg-[#eef5f0]">
        <PlantProvider>

          {/* 🌿 Header */}
          <Header />

          {/* ❌ Hide Navbar on login */}
          {!hideNavbar && <Navbar />}

          {/* Content */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4">
            {children}
          </div>

        </PlantProvider>
      </body>
    </html>
  );
}
