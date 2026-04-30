"use client";

import { uploadPheImages } from "@/lib/cloudinary";
import { useState, useEffect } from "react";


export default function AddPlantUtility() {
  const [form, setForm] = useState({
    category: "",
    name: "",
    description: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<
    { url: string; type: string; duration?: number }[]
  >([]);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    return () => {
      preview.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [preview]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ FILE CHANGE
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const heic2any = (await import("heic2any")).default;
    let processedFiles: File[] = [];

    for (const file of selected) {
      if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8,
          });
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

          const convertedFile = new File(
            [blob],
            file.name.replace(/\.heic$/i, ".jpg"),
            { type: "image/jpeg" }
          );

          processedFiles.push(convertedFile);
        } catch (err) {
          console.error("HEIC convert error:", err);
          processedFiles.push(file);
        }
      } else {
        processedFiles.push(file);
      }
    }

    setFiles((prev) => [...prev, ...processedFiles]);

    const previewData = processedFiles.map((file) => {
      const url = URL.createObjectURL(file);

      return {
        url,
        type: file.type.startsWith("video") ? "video" : "image",
      };
    });

    setPreview((prev) => [...prev, ...previewData]);

    e.target.value = "";
  };

  // ❌ REMOVE FILE
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ SUBMIT (FINAL FIX)
  const handleSubmit = async () => {
    try {
      if (saving) return; // ❌ prevent double click

      setSaving(true);

      if (!form.name.trim()) {
        alert("Enter name first ❌");
        return;
      }

      // 🔥 upload directly to Cloudinary
      const uploaded = await uploadPheImages(files, form.name);

      // 🔥 save in DB
      await fetch("/api/phe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          media: uploaded,
        }),
      });

      alert("Saved ✅");

      // reset form
      setForm({
        category: "",
        name: "",
        description: "",
      });
      setFiles([]);
      setPreview([]);
    } catch (err) {
      console.log(err);
      alert("Something went wrong ❌");
    } finally {
      setSaving(false); // 🔥 IMPORTANT
    }
  };

  return (
    <div className="container" >
      <h1 className="text-2xl font-bold text-green-700 mb-6">
        ADD TUHI🛠
      </h1>

      <div className="flex flex-col gap-4">
        {/* CATEGORY */}
        <div>
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full border p-3 rounded-lg"
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

        {/* NAME */}
        <div>
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>
      </div>

      {/* UPLOAD */}
      <div className="mt-5">
        <label className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer">
          Upload
          <input
            type="file"
            multiple
            accept="image/*,image/heic,video/*"
            hidden
            onChange={handleFileChange}
          />
        </label>

        <div className="flex gap-3 mt-3 flex-wrap">
          {preview.map((item, i) => (
            <div key={i} className="relative w-24 h-24">
              <button
                onClick={() => removeFile(i)}
                className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5"
              >
                ✕
              </button>

              {item.type === "video" ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="mt-5">
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full border p-3 rounded-lg"
        />

        <button
          disabled={saving}
          onClick={handleSubmit}
          className="w-full bg-green-600 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Add Item"}
        </button>
      </div>
      <style jsx>{`
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 16px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          box-sizing: border-box;
        }
          `}</style>
    </div>
  );
}