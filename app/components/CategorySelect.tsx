"use client";
import { useState, useRef, useEffect } from "react";

export const PLANT_CATEGORIES = [
  "Big tree ( મોટા ઝાડ )",
  "Small tree ( નાના ઝાડ )",
  "Palm tree ( પામ )",
  "Flowering plant ( ફુલ વાળા છોડ )",
  "Non flowering plants ( છોડવાઓ )",
  "Semi shade plant ( છાયા વાળા છોડ )",
  "Shape / cutting plant ( આકાર વાળા છોડ )",
  "Dwarf plants ( ડ્રાફ્ટ છોડ )",
  "Underground plant ( ગાંઠો  )",
  "Ground cover plant ( પથરાતા છોડ )",
  "lawn ( લોન )",
  "Creeper ( વેલ )",
  "Ornamental plants",
  "Indoor plant",
  "Seasonal plant",
  "Medicinal plant ( આર્યુવેદિક વનસ્પતિ )",
  "Fruit plant  ( ફળ ના ઝાડ )",
  "Miyavaki van (મિયાવાકી વન)",
  "Extra 1  ( વધારા ના 1 )",
  "Extra 2  ( વધારા ના 2 )",
];

export default function CategorySelect({
  value,
  onChange,
  placeholder = "Select Category",
  allOption = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  allOption?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect if dropdown should open upward
  const handleOpen = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 260); // if less than 260px below, open upward
    }
    setIsOpen((o) => !o);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full p-2 border rounded-xl text-left bg-white flex justify-between items-center text-sm"
      >
        <span className={value ? "text-gray-800 font-medium" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <span className="ml-2 text-gray-400 text-xs">{isOpen ? "▴" : "▾"}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto ${openUpward ? "bottom-full mb-1" : "top-full mt-1"
            }`}
        >
          {allOption && (
            <div
              className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm ${value === "" ? "bg-green-100 text-green-700 font-medium" : "text-gray-400"
                }`}
              onClick={() => { onChange(""); setIsOpen(false); }}
            >
              All Categories
            </div>
          )}
          {!allOption && (
            <div
              className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm ${value === "" ? "bg-green-100 text-green-700 font-medium" : "text-gray-400"
                }`}
              onClick={() => { onChange(""); setIsOpen(false); }}
            >
              Select Category
            </div>
          )}
          {PLANT_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`px-3 py-2 hover:bg-green-50 cursor-pointer text-sm ${value === cat ? "bg-green-100 text-green-700 font-medium" : "text-gray-700"
                }`}
              onClick={() => { onChange(cat); setIsOpen(false); }}
            >
              {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
