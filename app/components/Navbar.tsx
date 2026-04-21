"use client";

import { useRouter } from "next/navigation";
import { usePlant } from "../context/PlantContext";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { plantCount } = usePlant();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const status = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(status === "true");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-3 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        {/* 🔹 LEFT LINKS */}
        <div className="grid grid-cols-4 gap-2 w-full md:flex md:flex-wrap md:gap-3 md:w-auto">

          {/* Home */}
          <span
            onClick={() => router.push("/")}
           className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition flex items-center justify-center"
          >
            Home
          </span>

          {/* Add Plant */}
          <span
            onClick={() => router.push("/add")}
            className="text-xs md:text-sm font-medium py-2 px-1 md:px-3 rounded-lg text-center truncate bg-green-600 border border-green-600 text-white cursor-pointer hover:bg-green-700 transition"
          >
            + Add Plant
          </span>

          {/* Plant Health */}
          <span
            onClick={() => router.push("/phe")}
           className="text-xs md:text-sm font-medium py-2 px-1 md:px-3 rounded-lg text-center truncate border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition"
          >
          Plant Health & Equipment
          </span>

          {/* Add PHE */}
          <span
            onClick={() => router.push("/phe/add")}
           className="text-xs md:text-sm font-medium py-2 px-1 md:px-3 rounded-lg text-center truncate bg-green-600 border border-green-600 text-white cursor-pointer hover:bg-green-700 transition"
          >   
           +Add PHE
          </span>

        </div>

        {/* 🔹 RIGHT SIDE */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">

          {/* 🌿 Plant Count */}
          <div
            onClick={() => router.push("/report")}
            className="flex items-center justify-center gap-2 bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-green-200 transition w-full sm:w-auto"
          >
            <span className="font-bold text-green-700">
              {plantCount}
            </span>
            <span className="text-green-600 text-xs">
              plants
            </span>
          </div>

          {/* 🔐 Login / Logout */}
          {!isLoggedIn ? (
            <button
              onClick={() => router.push("/login")}
              className="w-full sm:w-auto bg-gray-800 text-white px-3 py-2 text-sm rounded-lg hover:bg-gray-900"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-red-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          )}

        </div>

      </div>
    </div>
  );
}