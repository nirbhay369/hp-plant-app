"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { deletePheImage,deletePheFolder } from "@/lib/cloudinary";

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
  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 6;


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

const startIndex = (currentPage - 1) * itemsPerPage;

const paginatedData = items.slice(
  startIndex,
  startIndex + itemsPerPage
);

const totalPages = Math.ceil(items.length / itemsPerPage);


  const current = selectedIndex !== null ? items[selectedIndex] : null;

  const next = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === items.length - 1 ? 0 : selectedIndex + 1
    );
  };

  const prev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === 0 ? items.length - 1 : selectedIndex - 1
    );
  };

  return (
    <div className="w-full flex-grow flex flex-col bg-gray-50 text-bold">
      <p className="text-sm text-gray-500 mb-4">
        SHOWING {items.length} ITEMS
      </p>

      {/* CARDS */}
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 font-bold " >
  {paginatedData.map((item, index) => (
    <div
      key={item.id}
      className="relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
      onClick={() => setSelectedIndex(index)}
    >
      <div className="h-1 bg-green-500" />

      {/* ✅ CATEGORY TOP RIGHT */}
      <div className="absolute top-3 right-4 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
        {item.category}
      </div>

      <div className="p-6">
        {/* HEADER */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">{item.name}</h2>

          {/* ✅ CATEGORY BELOW NAME */}
          <p className="text-green-600 text-sm mt-1">
            {item.category}
          </p>
        </div>

        {/* MEDIA */}
        <div className="flex gap-4 flex-wrap my-4">
          {(item.media || []).map((file, i) => {
            const isVideo = file.match(/\.(mp4|webm|mov|avi)$/i);


            return (
              <div
                key={i}
                className="w-24 h-24 rounded-xl overflow-hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaList(item.media);
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

        {/* DESCRIPTION */}
        <div className="bg-green-50 p-3 rounded-xl text-lg">
          {item.description || "No description"}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4 mt-4 pt-4 border-t">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/phe/edit/${item.id}`);
            }}
            className="text-green-700 text-sm"
          >
            Edit
          </button>

          <button   
          
            onClick={(e) => {
              e.stopPropagation();
              setDeleteItem(item);
            }}
            className="text-red-600 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
 

{/* ✅ PAGINATION YAHAN DAAL */}
<div className="flex justify-center gap-4 mt-10">
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage((p) => p - 1)}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="px-4 py-2">
    {currentPage} / {totalPages}
  </span>

  <button
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage((p) => p + 1)}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Next
  </button>
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