"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { deletePheFolder } from "@/lib/cloudinary";

type Item = {
  id: string;
  name: string;
  category: string;
  media: string[];
  description?: string;
};

export default function PhePage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [mediaIndex, setMediaIndex] = useState(0);

  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");


  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("phe")
      .select("id, name, category, media, description")
      .order("created_at", { ascending: false });

    if (error) console.log(error);
    else setItems(data || []);
  };

  const filteredItems = items.filter((item) => {
    if (!categoryFilter) return true;
    return item.category === categoryFilter;
  });

  let isDeleting = false;

  const deleteData = async (item: Item) => {
    if (!item) return;

    if (isDeleting) return; // ❌ prevent duplicate call
    isDeleting = true;

    try {
      await deletePheFolder(item.name);

      await supabase.from("phe").delete().eq("id", item.id);

      fetchItems();
    } catch (err) {
      console.log(err);
      alert("Delete failed ❌");
    } finally {
      isDeleting = false; // 🔥 reset
    }
  };


  const current = selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const next = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === filteredItems.length - 1 ? 0 : selectedIndex + 1
    );
  };

  const prev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === 0 ? filteredItems.length - 1 : selectedIndex - 1
    );
  };

  return (
    <div className="w-full flex-grow flex flex-col bg-gray-50 text-bold p-4 max-w-6xl mx-auto">
      <div className="flex flex-row items-center gap-4 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
          }}
          className="w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-green-700 font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Categories</option>
          <option>Equipments and Tools</option>
          <option>Water Irrigation</option>
          <option>Fertilizer</option>
          <option>Pesticides</option>
          <option>Planning (Our)</option>
          <option>Planning (Guruhari)</option>
          <option>Others</option>
        </select>

        <p className="text-sm text-gray-500 ml-auto">
          SHOWING {filteredItems.length} ITEMS
        </p>
      </div>

      {/* CARDS */}
      <div className="grid md:grid-cols-2 gap-6 font-bold" >
        {filteredItems.map((item, index) => {
          // Dynamic color based on category
          const getCategoryColor = (cat: string) => {
            if (cat.includes("Equipments")) return "bg-blue-500 border-blue-400 text-blue-700 bg-blue-100";
            if (cat.includes("Water")) return "bg-cyan-500 border-cyan-400 text-cyan-700 bg-cyan-100";
            if (cat.includes("Fertilizer")) return "bg-green-500 border-green-400 text-green-700 bg-green-100";
            if (cat.includes("Pesticides")) return "bg-red-500 border-red-400 text-red-700 bg-red-100";
            if (cat.includes("Planning")) return "bg-purple-500 border-purple-400 text-purple-700 bg-purple-100";
            return "bg-gray-500 border-gray-400 text-gray-700 bg-gray-100";
          };

          const colors = getCategoryColor(item.category);
          const topBarColor = colors.split(" ")[0];
          const badgeColors = colors.split(" ").slice(1).join(" ");

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedIndex(index)}
            >
              {/* 🔥 Top colored bar */}
              <div className={`h-1 ${topBarColor}`} />

              <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{item.name}</h2>
                    <p className="text-sm text-green-600">
                      {item.category}
                    </p>
                  </div>

                  {/* 🔥 CATEGORY BADGE */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeColors}`}>
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>


      {/* FULL SCREEN DETAIL */}
      {current && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={prev}
            className="absolute left-4 text-white text-4xl"
          >
            ‹
          </button>

          <div className="bg-white max-w-3xl w-full rounded-2xl p-6 max-h-[90vh] overflow-auto">
            <button
              onClick={() => setSelectedIndex(null)}
              className="float-right text-xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold">{current.name}</h2>
            <p className="text-green-600">{current.category}</p>

            <div className="flex gap-3 flex-wrap my-4">
              {current.media.map((file, i) =>
                file.match(/\.(mp4|webm|mov|avi)$/i) ? (
                  <video
                    key={i}
                    src={file}
                    className="w-24 h-24 object-cover rounded"
                    onClick={() => {
                      setMediaList(current.media);
                      setMediaIndex(i);
                      setMediaOpen(true);
                    }}
                  />
                ) : (
                  <img
                    key={i}
                    src={file}
                    className="w-24 h-24 object-cover rounded"
                    onClick={() => {
                      setMediaList(current.media);
                      setMediaIndex(i);
                      setMediaOpen(true);
                    }}
                  />
                )
              )}
            </div>

            <div className="bg-green-50 p-4 rounded">
              {current.description}
            </div>
          </div>

          <button
            onClick={next}
            className="absolute right-4 text-white text-4xl"
          >
            ›
          </button>
        </div>
      )}

      {/* MEDIA VIEWER */}
      {mediaOpen && (
        <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
          <button
            onClick={() => setMediaOpen(false)}
            className="absolute top-5 right-5 text-white text-3xl"
          >
            ✕
          </button>

          <button
            onClick={() =>
              setMediaIndex((p) =>
                p === 0 ? mediaList.length - 1 : p - 1
              )
            }
            className="absolute left-5 text-white text-5xl"
          >
            ‹
          </button>

          {mediaList[mediaIndex]?.match(/\.(mp4|webm|mov|avi)$/i) ? (
            <video
              src={mediaList[mediaIndex]}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          ) : (
            <img
              src={mediaList[mediaIndex]}
              className="max-w-full max-h-full"
            />
          )}

          <button
            onClick={() =>
              setMediaIndex((p) =>
                p === mediaList.length - 1 ? 0 : p + 1
              )
            }
            className="absolute right-5 text-white text-5xl"
          >
            ›
          </button>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl w-[300px] text-center shadow-xl overflow-hidden">

            {/* TITLE */}
            <h3 className="text-lg font-semibold text-green-800 mt-5">
              Confirmation
            </h3>

            {/* MESSAGE */}
            <p className="text-gray-600 text-sm px-6 py-4">
              Are you sure you want to delete this item?
            </p>

            {/* DIVIDER */}
            <div className="border-t" />

            {/* ACTIONS */}
            <div className="flex">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 py-3 text-blue-600 font-medium border-r"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                className="flex-1 py-3 text-red-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={async () => {
                  if (deleting) return; // 🔥 prevent double click

                  setDeleting(true);

                  try {
                    await deleteData(deleteItem);
                    setDeleteItem(null);
                  } catch (e) {
                    console.log(e);
                  } finally {
                    setDeleting(false); // 🔥 VERY IMPORTANT
                  }
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}