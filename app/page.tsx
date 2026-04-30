"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { usePlant } from "./context/PlantContext";
import { Pencil, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";

type Plant = {
  id: string;
  name: string;
  images: string[];
  category: string;
  flower_type: string;
  flower_duration: string;
  flower_color: string;
  hedge: string;
  height_ft: string;
  width_ft: string;
  shape: string;
  variety: string;
  shade: string;
  water: string;
  uses: string;
};

export default function Home() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const { setPlantCount } = usePlant();
  const [search, setSearch] = useState("");
  const [flowerFilter, setFlowerFilter] = useState("");
  const [shadeFilter, setShadeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [hedgeFilter, setHedgeFilter] = useState("");
  const [shapeFilter, setShapeFilter] = useState("");
  const [varietyFilter, setVarietyFilter] = useState("");

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [deletePlantData, setDeletePlantData] = useState<Plant | null>(null);

  const fetchPlants = async () => {
    const { data } = await supabase
      .from("plants")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPlants(data);
  };


  useEffect(() => {
    const loadPlants = async () => {
      await fetchPlants();
    };

    loadPlants();
  }, []);
  useEffect(() => {
    setPlantCount(plants.length);
  }, [plants]);

  const deletePlant = async (plant: Plant) => {


    try {
      if (plant.images?.length) {
        const url = plant.images[0];
        let publicId = url.split("/upload/")[1];
        publicId = publicId.replace(/^v\d+\//, "");
        publicId = decodeURIComponent(publicId);
        const parts = publicId.split("/");
        parts.pop();
        const folderPath = parts.join("/");

        await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderPath }),
        });
      }

      await supabase.from("plants").delete().eq("id", plant.id);
      fetchPlants();
    } catch (e) {
      console.log(e);
      alert("❌ Delete failed");
    }
  };

  const filtered = plants.filter((p) => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (flowerFilter ? p.flower_type === flowerFilter : true) &&
      (shadeFilter ? p.shade === shadeFilter : true) &&
      (categoryFilter ? p.category === categoryFilter : true) &&
      (hedgeFilter ? p.hedge === hedgeFilter : true) &&
      (shapeFilter ? p.shape === shapeFilter : true) &&
      (varietyFilter ? p.variety === varietyFilter : true)
    );
  })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      })
    );

  const current = selectedIndex !== null ? filtered[selectedIndex] : null;

  const next = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === filtered.length - 1 ? 0 : selectedIndex + 1
    );
  };

  const prev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === 0 ? filtered.length - 1 : selectedIndex - 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;

    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;

    // ❌ TAP ignore
    if (Math.abs(diffX) < 70) return;

    // ❌ vertical swipe ignore
    if (Math.abs(diffX) < Math.abs(diffY)) return;

    // 👉 RIGHT swipe → PREV
    if (diffX > 0) {
      if (mediaOpen) {
        setMediaIndex((prev) =>
          prev === 0 ? 0 : prev - 1
        );
      } else if (selectedIndex !== null) {
        prev();
      }
    }

    // 👉 LEFT swipe → NEXT
    else {
      if (mediaOpen) {
        setMediaIndex((prev) =>
          prev === mediaList.length - 1 ? mediaList.length - 1 : prev + 1
        );
      } else if (selectedIndex !== null) {
        next();
      }
    }

    // reset
    touchStartX.current = 0;
    touchEndX.current = 0;
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // 🎯 MEDIA VIEWER
      if (mediaOpen) {
        if (e.key === "ArrowRight") {
          setMediaIndex((prev) =>
            prev === mediaList.length - 1 ? mediaList.length - 1 : prev + 1
          );
        }

        if (e.key === "ArrowLeft") {
          setMediaIndex((prev) =>
            prev === 0 ? 0 : prev - 1
          );
        }

        if (e.key === "Escape") setMediaOpen(false);
      }

      // 🎯 CARD MODAL
      else if (selectedIndex !== null) {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "Escape") setSelectedIndex(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mediaOpen, selectedIndex, mediaList]);

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* NAVBAR */}


      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search plant..."
        className="w-full px-4 py-2 border rounded-lg bg-white text-green-700 font-bold"
      />
      <br />
      <br />

      {/* FILTERS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg 
                  bg-white text-green-700 text-l font-bold
                    focus:outline-none focus:ring-2 focus:ring-green-500">
          <option className="font-bold" value="">Select Categories</option>
          <option className="font-bold">Big tree ( મોટા ઝાડ )</option>
          <option className="font-bold">Small tree ( નાના ઝાડ )</option>
          <option className="font-bold">Palm tree ( પામ )</option>
          <option className="font-bold">Flowering plant ( ફુલ વાળા છોડ )</option>
          <option className="font-bold">Non flowering plants ( છોડવાઓ )</option>
          <option className="font-bold">Semi shade plant ( છાયા વાળા છોડ )</option>
          <option className="font-bold">Shape / cutting plant ( આકાર વાળા છોડ )</option>
          <option className="font-bold">Dwarf plants ( ડ્રાફ્ટ છોડ )</option>
          <option className="font-bold">Underground plant ( ગાંઠો  )</option>
          <option className="font-bold">Ground cover plant ( પથરાતા છોડ )</option>
          <option className="font-bold">lawn ( લોન )</option>
          <option className="font-bold">Creeper ( વેલ )</option>
          <option className="font-bold">Ornamental plants</option>
          <option className="font-bold">Indoor plant</option>
          <option className="font-bold">Seasonal plant</option>
          <option className="font-bold">Medicinal plant ( આર્યુવેદિક વનસ્પતિ )</option>
          <option className="font-bold">Fruit plant  ( ફળ ના ઝાડ )</option>
          <option className="font-bold">Miyavaki van (મિયાવાકી વન)</option>
          <option className="font-bold">Extra 1  ( વધારા ના 1 )</option>
          <option className="font-bold">Extra 2  ( વધારા ના 2 )</option>
          <option className="font-bold">Extra 3  ( વધારા ના 3 )</option>

        </select>

        <select
          value={shadeFilter}
          onChange={(e) => setShadeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 font-bold
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option className="font-bold" value="">Select Shade</option>
          <option className="font-bold" value="Full - Sun">Full - Sun</option>
          <option className="font-bold" value="Semi-Shade">Semi-Shade</option>
          <option className="font-bold" value="Indoor">Indoor</option>
        </select>

        <select
          value={flowerFilter}
          onChange={(e) => setFlowerFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 font-bold
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option className="font-bold" value="">Select Flowering Type</option>
          <option className="font-bold" value="Flowering">Flowering</option>
          <option className="font-bold" value="Non-Flowering">Non-Flowering</option>
        </select>

        <select
          value={hedgeFilter}
          onChange={(e) => setHedgeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 font-bold
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option className="font-bold" value="">Select Hedge</option>
          <option className="font-bold">Hedge</option>
          <option className="font-bold">Non-Hedge</option>
        </select>

        <select
          value={shapeFilter}
          onChange={(e) => setShapeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 font-bold
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option className="font-bold" value="">Select Shape</option>
          <option className="font-bold">Single-Shape</option>
          <option className="font-bold">Multi-Shape</option>
          <option className="font-bold">Natural canopy</option>
        </select>

        <select
          value={varietyFilter}
          onChange={(e) => setVarietyFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 font-bold
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option className="font-bold" value="">Select Variety</option>
          <option className="font-bold">Simple</option>
          <option className="font-bold">Varigated</option>
          <option className="font-bold">Dwarf</option>
        </select>
      </div>

      {/* SHOWING COUNT */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 mt-10 text-lg">
          {plants.length === 0
            ? "🌿 No plants added yet"
            : "❌ No plants match your filters"}
        </p>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          SHOWING {filtered.length} PLANTS
        </p>
      )}
      {/* CARDS - NEW DESIGN */}
      <div id="cards-start" className="grid md:grid-cols-2 gap-6 scroll-mt-24">
        {filtered.map((p, index) => {

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedIndex(index)} // ✅ FIXED
            >

              {/* 🔥 Top colored bar (CATEGORY BASED) */}
              <div
                className={`h-1 ${p.category.includes("Big tree")
                  ? "bg-blue-500"
                  : p.category.includes("Small tree")
                    ? "bg-green-500"
                    : p.category.includes("Palm tree")
                      ? "bg-yellow-500"
                      : p.category.includes("Flowering plant")
                        ? "bg-pink-500"
                        : p.category.includes("Indoor")
                          ? "bg-purple-500"
                          : p.category.includes("Fruit")
                            ? "bg-orange-500"
                            : p.category.includes("Medicinal")
                              ? "bg-lime-500"
                              : "bg-gray-400"
                  }`}
              />

              <div className="p-5">

                {/* Header */}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{p.name}</h2>
                  </div>

                  {/* 🔥 CATEGORY BADGE */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${p.category.includes("Big tree")
                      ? "bg-blue-100 text-blue-700 border-blue-400"
                      : p.category.includes("Small tree")
                        ? "bg-green-100 text-green-700 border-green-400"
                        : p.category.includes("Palm tree")
                          ? "bg-yellow-100 text-yellow-700 border-yellow-400"
                          : p.category.includes("Flowering plant")
                            ? "bg-pink-100 text-pink-700 border-pink-400"
                            : p.category.includes("Indoor")
                              ? "bg-purple-100 text-purple-700 border-purple-400"
                              : p.category.includes("Fruit")
                                ? "bg-orange-100 text-orange-700 border-orange-400"
                                : p.category.includes("Medicinal")
                                  ? "bg-lime-100 text-lime-700 border-lime-400"
                                  : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                  >
                    {p.category.split("(")[0]}
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN CARD MODAL */}
      {current && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 font-extrabold"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >

          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-auto max-h-[90vh]">
            <div className="p-6">
              <div className="flex justify-end items-center gap-2 mb-2">

                {/* DELETE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (current) setDeletePlantData(current);
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>

                {/* EDIT */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (current) router.push(`/edit/${current.id}`);
                  }}
                  className="p-2 rounded-lg hover:bg-green-50 transition"
                >
                  <Pencil className="w-5 h-5 text-green-600" />
                </button>

                <button
                  onClick={() => setSelectedIndex(null)}
                  className="float-right text-2xl text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <h2 className="text-3xl font-bold text-gray-800">{current.name}</h2>
              <p className="text-green-600 mb-4">{current.category}</p>

              {/* Media Gallery */}
              <div className="flex gap-3 flex-wrap mb-6">
                {current.images.map((img, i) =>
                  img.match(/\.(mp4|webm|mov|avi)$/i) ? (
                    <video
                      key={i}
                      src={img}
                      className="w-24 h-24 rounded-xl object-cover cursor-pointer hover:opacity-80"
                      onClick={() => {
                        setMediaList(current.images);
                        setMediaIndex(i);
                        setMediaOpen(true);
                      }}
                    />
                  ) : (
                    <img
                      key={i}
                      src={img}
                      className="w-24 h-24 rounded-xl object-cover cursor-pointer hover:opacity-80"
                      onClick={() => {
                        setMediaList(current.images);
                        setMediaIndex(i);
                        setMediaOpen(true);
                      }}
                    />
                  )
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-base">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Type</p>
                  <p className="font-medium">{current.flower_type}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Height</p>
                  <p className="font-medium">{current.height_ft} ft</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Color</p>
                  <p className="font-medium">{current.flower_color || "—"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Width</p>
                  <p className="font-medium">{current.width_ft} ft</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Season</p>
                  <p className="font-medium">{current.flower_duration}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Shape</p>
                  <p className="font-medium">{current.shape}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Shade</p>
                  <p className="font-medium">{current.shade}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Hedge</p>
                  <p className="font-medium">{current.hedge}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Variety</p>
                  <p className="font-medium">{current.variety}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase">Water</p>
                  <p className="font-medium">{current.water}</p>
                </div>
              </div>

              {/* Uses */}
              <div className="bg-green-50 p-4 rounded-xl mt-4">
                <p className="text-gray-400 text-xs uppercase mb-1">Uses</p>
                <div dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(current.uses),
                }}
                />
              </div>
            </div>
          </div>


        </div>
      )}

      {/* MEDIA FULLSCREEN VIEWER */}
      {mediaOpen && (
        <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>

          <button
            onClick={() => setMediaOpen(false)}
            className="absolute top-5 right-5 text-white text-3xl hover:scale-110 transition"
          >
            ✕
          </button>



          {mediaList[mediaIndex]?.match(/\.(mp4|webm|mov|avi)$/i) ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <video
                src={mediaList[mediaIndex]}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <img
              src={mediaList[mediaIndex]}
              className="max-w-full max-h-full object-contain"
            />
          )}


        </div>
      )}
      {deletePlantData && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <h3>Confirmation</h3>
            <p>Are you sure you want to delete this plant?</p>

            <div className="actions">
              <button
                className="cancel"
                onClick={() => setDeletePlantData(null)}
              >
                Cancel
              </button>

              <button
                className="delete"
                onClick={async () => {
                  await deletePlant(deletePlantData);
                  setDeletePlantData(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>

          <style jsx>{`
  .confirmOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.confirmBox {
  background: white;
  border-radius: 16px;
  width: 280px;
  text-align: center;
  overflow: hidden;
}

.confirmBox h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.confirmBox p {
  font-size: 14px;
  padding: 0 16px 16px;
  color: #444;
}

.actions {
  display: flex;
  border-top: 1px solid #eee;
}

.actions button {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  border: none;
  background: none;
  cursor: pointer;
}

.cancel {
  color: #007aff;
  border-right: 1px solid #eee;
}

.delete {
  color: #ff3b30;
  font-weight: 600;
} 
    `}</style>
        </div>
      )}
    </div>
  );
}
