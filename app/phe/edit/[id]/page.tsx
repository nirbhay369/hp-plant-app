"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadPheImages, deleteImage } from "@/lib/cloudinary";

export default function EditPhe() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState<any>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data } = await supabase
        .from("phe")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setForm({ ...data, newFiles: [] });
        setPreview(data.media || []);
      }
    };

    fetchData();
  }, [id]);

  if (!form) return <div>Loading...</div>;

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const arr = Array.from(files);
    const urls = arr.map((file) => URL.createObjectURL(file));

    setPreview((prev) => [...prev, ...urls]);

    setForm((prev: any) => ({
      ...prev,
      newFiles: [...(prev.newFiles || []), ...arr],
    }));
  };

  const removeFile = async (index: number) => {
    const file = preview[index];
    const oldCount = form.media?.length || 0;

    if (index < oldCount) {
      if (!file.startsWith("blob:")) {
        await deleteImage(file);
      }

      const updatedMedia = [...form.media];
      updatedMedia.splice(index, 1);

      const updatedPreview = [...preview];
      updatedPreview.splice(index, 1);

      setPreview(updatedPreview);

      setForm((prev: any) => ({
        ...prev,
        media: updatedMedia,
      }));
    } else {
      const newIndex = index - oldCount;

      const updatedNewFiles = [...(form.newFiles || [])];
      updatedNewFiles.splice(newIndex, 1);

      const updatedPreview = [...preview];
      updatedPreview.splice(index, 1);

      setPreview(updatedPreview);

      setForm((prev: any) => ({
        ...prev,
        newFiles: updatedNewFiles,
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let mediaUrls = form.media || [];

      if (form.newFiles?.length) {
        const uploaded = await uploadPheImages(form.newFiles, form.name);
        mediaUrls = [...mediaUrls, ...uploaded];
      }

      const clean = { ...form };
      delete clean.newFiles;

      await supabase
        .from("phe")
        .update({
          ...clean,
          media: mediaUrls,
        })
        .eq("id", id);

      alert("Updated ✅");
      router.push("/phe");
    } catch (err) {
      console.log(err);
      alert("Error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto bg-white p-4 sm:p-8 rounded-2xl shadow-lg border border-gray-200 w-full">

        <h1 className="text-2xl font-bold text-green-700 mb-6">
          🛠 Edit PHE Item
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full border p-3 rounded-lg mt-1"
            >
              <option value="">Select</option>
              <option>Equipments and Tools</option>
              <option>Water Irrigation</option>
              <option>Fertilizer</option>
              <option>Pesticides</option>
              <option>Planning (Our)</option>
              <option>Planning (Guruhari)</option>
              <option>Others</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Name</label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border p-3 rounded-lg mt-1"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer inline-block">
            📤 Upload Images / Videos
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </label>

          <div className="flex gap-3 mt-3 flex-wrap">
            {preview.map((file, i) => {
              const oldCount = form.media?.length || 0;

              let isVideo = false;

              if (!file.startsWith("blob:")) {
                isVideo = !!file.match(/\.(mp4|webm|mov|avi)$/i);
              } else {
                const newIndex = i - oldCount;
                const newFile = form.newFiles?.[newIndex];
                isVideo = newFile?.type.startsWith("video");
              }

              return (
                <div key={i} className="relative w-24 h-24">
                  <button
                    onClick={() => setDeleteIndex(i)}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 z-10"
                  >
                    ✕
                  </button>

                  {isVideo ? (
                    <video
                      src={file}
                      className="w-full h-full object-cover rounded pointer-events-none"
                    />
                  ) : (
                    <img
                      src={file}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm text-gray-600">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full border p-3 rounded-lg mt-1"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 text-white p-3 rounded-lg mt-4"
        >
          {loading ? "Saving..." : "🛠 Update Item"}
        </button>
      </div>

      {/* DELETE CONFIRM */}
      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[300px] text-center shadow-xl overflow-hidden">
            <h3 className="text-lg font-semibold text-green-800 mt-5">
              Confirmation
            </h3>

            <p className="text-gray-600 text-sm px-6 py-4">
              Are you sure you want to delete this image/video?
            </p>

            <div className="border-t" />

            <div className="flex">
              <button
                onClick={() => setDeleteIndex(null)}
                className="flex-1 py-3 text-blue-600 font-medium border-r"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  removeFile(deleteIndex);
                  setDeleteIndex(null);
                }}
                className="flex-1 py-3 text-red-500 font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}