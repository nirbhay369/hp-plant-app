"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { usePlant } from "./context/PlantContext";
import { Pencil, Trash2 } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const limit = 12;
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
  window.scrollTo(0, 0);
}, [page]);

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
  const totalPages = Math.ceil(filtered.length / limit);
  const paginatedData = filtered.slice((page - 1) * limit, page * limit);

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
        prev === 0 ? mediaList.length - 1 : prev - 1
      );
    } else if (selectedIndex !== null) {
      prev();
    }
  }

  // 👉 LEFT swipe → NEXT
  else {
    if (mediaOpen) {
      setMediaIndex((prev) =>
        prev === mediaList.length - 1 ? 0 : prev + 1
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
          prev === mediaList.length - 1 ? 0 : prev + 1
        );
      }

      if (e.key === "ArrowLeft") {
        setMediaIndex((prev) =>
          prev === 0 ? mediaList.length - 1 : prev - 1
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
        className="w-full px-4 py-2 border rounded-lg bg-white text-green-700"
      />
      <br/>
       <br/>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg 
                  bg-white text-green-700 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Select Category</option>
          <option>Big tree ( મોટા ઝાડ )</option>
          <option>Small tree ( નાના ઝાડ )</option>
          <option>Palm tree ( પામ )</option>
          <option>Flowering plant ( ફુલ વાળા છોડ )</option>
          <option>Non flowering plants ( છોડવાઓ )</option>
          <option>Semi shade plant ( છાયા વાળા છોડ )</option>
          <option>Shape / cutting plant ( આકાર વાળા છોડ )</option>
          <option>Dwarf plants ( ડ્રાફ્ટ છોડ )</option>
          <option>Underground plant ( ગાંઠો )</option>
          <option>Ground cover plant ( પથરાતા છોડ )</option>
          <option>lawn ( લોન )</option>
          <option>Creeper ( વેલ )</option>
          <option>Ornamental plants</option>
          <option>Indoor plant</option>
          <option>Seasonal plant</option>
          <option>Medicinal plant ( આર્યુવેદિક વનસ્પતિ )</option>
          <option>Fruit plant ( ફળ ના ઝાડ )</option>
        </select>

        <select
          value={shadeFilter}
          onChange={(e) => setShadeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Shade</option>
          <option value="Full - Sun">Full - Sun</option>
          <option value="Semi-Shade">Semi-Shade</option>
          <option value="Indoor">Indoor</option>
        </select>

        <select
          value={flowerFilter}
          onChange={(e) => setFlowerFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Flowering Type</option>
          <option value="Flowering">Flowering</option>
          <option value="Non-Flowering">Non-Flowering</option>
        </select>

        <select
          value={hedgeFilter}
          onChange={(e) => setHedgeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Hedge</option>
          <option>Hedge</option>
          <option>Non-Hedge</option>
        </select>

        <select
          value={shapeFilter}
          onChange={(e) => setShapeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Shape</option>
          <option>Multi-Shape</option>
          <option>Single</option>
        </select>

        <select
          value={varietyFilter}
          onChange={(e) => setVarietyFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             bg-white text-green-700 
             focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Variety</option>
          <option>Simple</option>
          <option>Varigated</option>
          <option>Dwarf</option>
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
    SHOWING {paginatedData.length} OF {filtered.length} PLANTS
  </p>
)}
      {/* CARDS - NEW DESIGN */}
      <div className="grid md:grid-cols-2 gap-6">
        {paginatedData.map((p, index) => {  
         

          const isFlowering = p.flower_type === "Flowering";

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedIndex(filtered.indexOf(p))}
            >
              {/* Top colored bar */}
              <div
                className={`h-1 ${
                  isFlowering ? "bg-green-500" : "bg-blue-500"
                }`}
              />

              <div className="p-5">
                {/* Header with name and badge */}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{p.name}</h2>
                    <p className="text-sm text-green-600">{p.category}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isFlowering
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {p.flower_type}
                  </span>
                </div>

                {/* Media Icons Row */}

                {/* MEDIA PREVIEW */}
<div className="flex flex-wrap gap-3 my-4">
  {(p.images || []).map((file, i) => {
    const isVideo = file.match(/\.(mp4|webm|mov|avi)$/i);

    return (
      <div
        key={i}
        className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setMediaList(p.images);
          setMediaIndex(i);
          setMediaOpen(true);
        }}
      >
        {isVideo ? (
          <video
            src={file}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={file}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  })}
</div>
               {/* Attributes Grid */}
            

                {/* Actions */}
              
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
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
                <p className="text-gray-800">{current.uses}</p>
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
          className="max-w-full max-h-full object-contain"/>
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
