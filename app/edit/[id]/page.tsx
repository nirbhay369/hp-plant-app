"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadImages } from "@/lib/cloudinary";
import { deleteImage } from "@/lib/cloudinary";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

type EditPlantForm = {
  category: string;
  name: string;
  images: string[];
  newImages?: File[];
  flower_type?: string;
  flower_duration?: string;
  flower_color?: string;
  hedge?: string;
  height_ft?: string;
  width_ft?: string;
  shape?: string;
  uses?: string;
  shade?: string;
  water?: string;
  variety?: string;
  [key: string]: string | string[] | File[] | undefined;
};

export default function EditPlant() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const router = useRouter();

  const [form, setForm] = useState<EditPlantForm | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [durations, setDurations] = useState<number[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPlant = async () => {
      const { data } = await supabase
        .from("plants")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setForm({
          ...data,
          newImages: [],
        });

        setPreview(data.images || []);
      }
    };

    fetchPlant();
  }, [id]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      Highlight,
    ],
    content: "", // ✅ ONLY empty
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      handleChange("uses", editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && form?.uses && !editor.isFocused) {
      editor.commands.setContent(form.uses);
    }
  }, [editor, form?.uses]);


  if (!form) return <div className="container">Loading...</div>;

  const handleChange = <K extends keyof EditPlantForm>(
    key: K,
    value: EditPlantForm[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const heic2any = (await import("heic2any")).default;

    const arr = Array.from(files);
    let processedFiles: File[] = [];

    for (const file of arr) {
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

    const urls = processedFiles.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...urls]);

    setForm((prev) =>
      prev
        ? {
          ...prev,
          newImages: [...(prev.newImages || []), ...processedFiles],
        }
        : prev
    );

    e.target.value = "";
  };

  const removeImage = async (index: number) => {
    const imageToDelete = preview[index];

    // ✅ delete from cloudinary (only if already uploaded)
    if (imageToDelete && !imageToDelete.startsWith("blob:")) {
      await deleteImage(imageToDelete);
    }

    const updatedPreview = [...preview];
    updatedPreview.splice(index, 1);

    setPreview(updatedPreview);

    setForm((prev) =>
      prev
        ? {
          ...prev,
          images: updatedPreview.filter((url) => !url.startsWith("blob:")),
          newImages: (prev.newImages || []).filter((_, i) => i !== index),
        }
        : prev
    );
  };

  const handleSubmit = async () => {
    if (!id) return;

    setLoading(true);

    try {
      let imageUrls = form.images || [];

      // ✅ DEBUG: Check first image URL
      console.log("🔍 form.images[0]:", imageUrls[0]);
      console.log("🔍 form.name:", form.name);
      console.log("🔍 includes plants/:", imageUrls[0]?.includes("plants/"));

      const oldName =
        imageUrls.length > 0 && imageUrls[0].includes("plants/")
          ? decodeURIComponent(imageUrls[0].split("plants/")[1].split("/")[0])
          : null;

      console.log("🔍 oldName extracted:", oldName);
      console.log("🔍 oldName !== form.name:", oldName !== form.name);

      const newFolder = `plants/${form.name}`;

      // ✅ MOVE OLD IMAGES
      if (oldName && oldName !== form.name && imageUrls.length > 0) {
        console.log("✅ Rename triggered! Moving from", oldName, "→", newFolder);
        const res = await fetch("/api/editImg", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            urls: imageUrls,
            newFolder,
          }),
        });

        const data = await res.json();
        console.log("📦 editImg API response:", data);

        if (data.success) {
          imageUrls = data.urls;
          console.log("✅ imageUrls updated to:", imageUrls);
        } else {
          console.error("❌ Rename failed:", data.error);
          alert("⚠️ Cloudinary rename failed: " + (data.error || "unknown error"));
        }
      } else {
        console.log("⏭️ Rename NOT triggered. oldName:", oldName, "form.name:", form.name);
      }


      if (form.newImages?.length) {
        const uploaded = await uploadImages(form.newImages, form.name);
        imageUrls = [...imageUrls, ...uploaded];
      }

      const cleanForm = { ...form };
      delete cleanForm.newImages;

      const { error } = await supabase
        .from("plants")
        .update({
          ...cleanForm,
          images: imageUrls,
        })
        .eq("id", id);

      if (error) {
        alert("❌ " + error.message);
        return;
      }

      alert("✅ Updated");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Error uploading images. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container">
      <h1 className="title">🌱 Edit Plant</h1>

      <div className="grid grid-cols-1 gap-4">
        {/* CATEGORY */}
        <div className="field">
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
          >
            <option>Big tree ( મોટા ઝાડ )</option>
            <option>Small tree ( નાના ઝાડ )</option>
            <option>Palm tree ( પામ )</option>
            <option>Flowering plant ( ફુલ વાળા છોડ )</option>
            <option>Non flowering plants ( છોડવાઓ )</option>
            <option>Semi shade plant ( છાયા વાળા છોડ )</option>
            <option>Shape / cutting plant ( આકાર વાળા છોડ )</option>
            <option>Dwarf plants ( ડ્રાફ્ટ છોડ )</option>
            <option>Underground plant ( ગાંઠો  )</option>
            <option>Ground cover plant ( પથરાતા છોડ )</option>
            <option>lawn ( લોન )</option>
            <option>Creeper ( વેલ )</option>
            <option>Ornamental plants</option>
            <option>Indoor plant</option>
            <option>Seasonal plant</option>
            <option>Medicinal plant ( આર્યુવેદિક વનસ્પતિ )</option>
            <option>Fruit plant  ( ફળ ના ઝાડ )</option>
            <option>Miyavaki van (મિયાવાકી વન)</option>
            <option>Extra 1  ( વધારા ના 1 )</option>
            <option>Extra 2  ( વધારા ના 2 )</option>
            <option>Extra 3  ( વધારા ના 3 )</option>

          </select>
        </div>

        {/* NAME */}
        <div className="field">
          <label>Plant Name</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
      </div>



      {/* UPLOAD */}
      <label className="uploadBtn">
        📤 Upload Images / Videos
        <input
          type="file"
          multiple
          accept="image/*,image/heic,video/*"
          hidden
          onChange={handleImageChange}
        />
      </label>

      {/* PREVIEW */}
      <div className="preview">
        {preview.map((file, i) => {
          const oldImagesCount = form.images?.length || 0;

          const isVideo = file.startsWith("blob:")
            ? form.newImages?.[i - oldImagesCount]?.type.startsWith("video")
            : file.match(/\.(mp4|webm|mov|avi)$/i);

          return (
            <div key={i} className="imgBox">
              {isVideo ? (
                <>
                  <video
                    src={file}
                    className="previewMedia"
                    onLoadedMetadata={(e) => {
                      const duration = e.currentTarget.duration;

                      setDurations((prev) => {
                        const updated = [...prev];
                        updated[i] = duration;
                        return updated;
                      });
                    }}
                  />
                  <div className="duration">
                    {durations[i]
                      ? `${Math.floor(durations[i] / 60)}:${Math.floor(
                        durations[i] % 60
                      )
                        .toString()
                        .padStart(2, "0")}`
                      : ""}
                  </div>
                </>
              ) : (
                <img src={file} className="previewMedia" />
              )}<button onClick={() => setDeleteIndex(i)}>✕</button>
            </div>
          );
        })}
      </div>

      {/* FLOWER */}
      <div className="field">
        <label>Flower / Non-Flower</label>
        <select
          value={form.flower_type}
          onChange={(e) => handleChange("flower_type", e.target.value)}
        >
          <option value="">Select</option>
          <option>Flowering</option>
          <option>Non-Flowering</option>
        </select>
      </div>

      {form.flower_type === "Flowering" && (
        <>
          <div className="field">
            <label>Flower Color</label>
            <input
              value={form.flower_color}
              onChange={(e) =>
                handleChange("flower_color", e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Flowering Season</label>
            <select
              value={form.flower_duration}
              onChange={(e) =>
                handleChange("flower_duration", e.target.value)
              }
            >
              <option value="">Select</option>
              <option>All Season</option>
              <option>Summer</option>
              <option>Winter</option>
              <option>Monsoon</option>
            </select>
          </div>
        </>
      )}

      {/* HEIGHT WIDTH */}
      <div className="field">

        <label>Height (ft)</label>
        <input
          value={form.height_ft}
          onChange={(e) => handleChange("height_ft", e.target.value)}
        />
      </div>

      <div className="field">
        <label>Width (ft)</label>
        <input
          value={form.width_ft}
          onChange={(e) => handleChange("width_ft", e.target.value)}
        />
      </div>
      {/* HEDGE */}
      <div className="field">
        <label>Hedge</label>
        <select
          value={form.hedge}
          onChange={(e) => handleChange("hedge", e.target.value)}
        >
          <option value="">Select</option>
          <option>Hedge</option>
          <option>Non-Hedge</option>
        </select>
      </div>

      {/* SHADE */}
      <div className="field">
        <label>Shade</label>
        <select
          value={form.shade}
          onChange={(e) => handleChange("shade", e.target.value)}
        >
          <option value="">Select</option>
          <option>Full - Sun</option>
          <option>Semi-Shade</option>
          <option>Indoor</option>
        </select>
      </div>

      {/* VARIETY */}
      <div className="field">
        <label>Variety</label>
        <select
          value={form.variety}
          onChange={(e) => handleChange("variety", e.target.value)}
        >
          <option value="">Select</option>
          <option>Simple</option>
          <option>Varigated</option>
          <option>Dwarf</option>
        </select>
      </div>

      {/* SHAPE */}
      <div className="field">
        <label>Shape / Cutting</label>
        <select
          value={form.shape}
          onChange={(e) => handleChange("shape", e.target.value)}
        >
          <option value="">Select</option>
          <option>Single-Shape</option>
          <option>Multi-Shape</option>
          <option>Natural canopy</option>

        </select>
      </div>

      {/* WATER */}
      <div className="field">
        <label>Water Requirement</label>
        <select
          value={form.water}
          onChange={(e) => handleChange("water", e.target.value)}
        >
          <option value="">Select</option>
          <option>Normal / Moderate</option>
          <option>More Water</option>
          <option>Less Water</option>
        </select>
      </div>

      {/* USES */}
      <div className="field">
        <label className="text-green-700 font-semibold mb-2">
          Description / Uses
        </label>

        {editor && (
          <div className="rounded-xl border border-green-300 bg-white shadow-sm">

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-green-50">

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-2 py-1 text-sm rounded ${editor.isActive("bold")
                  ? "bg-green-200 text-green-900"
                  : "bg-white border"
                  }`}
              >
                B
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-2 py-1 text-sm rounded ${editor.isActive("italic")
                  ? "bg-green-200 text-green-900"
                  : "bg-white border"
                  }`}
              >
                I
              </button>

              {/* Highlight toggle */}
              <button
                type="button"
                onClick={() => {
                  if (editor.isActive("highlight")) {
                    editor.chain().focus().unsetHighlight().run();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .toggleHighlight({ color: "#fde047" })
                      .run();
                  }
                }}
                className={`px-2 py-1 rounded ${editor.isActive("highlight")
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-200"
                  }`}
              >
                🖍
              </button>
            </div>

            {/* Editor */}
            <div className="p-3 min-h-[120px] text-sm">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>



      <button onClick={handleSubmit} className="submit">
        {loading ? "Saving..." : "🌿 Update Plant"}
      </button>
      {deleteIndex !== null && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <h3>Confirmation</h3>
            <p>Are you sure you want to delete this image/video?</p>

            <div className="actions">
              <button
                className="cancel"
                onClick={() => setDeleteIndex(null)}
              >
                Cancel
              </button>


              <button
                className="delete"
                onClick={() => {
                  removeImage(deleteIndex);
                  setDeleteIndex(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FIXED CSS */}
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

        .title {
          font-size: 24px;
          color: #15803d;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .field {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }

        label {
          font-size: 13px;
          color: #166534;
          margin-bottom: 4px;
        }

        input, select, textarea {
          width: 100%;
          max-width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 10px;
          font-weight: bold;
          box-sizing: border-box;
        }
        
        .field {
          position: relative; /* important for preventing dropdown overflow breaks */
          flex: 1;
        }

       
        @media (min-width: 640px) {
          .grid {
            grid-template-columns: 1fr ;
          }
        }

        .uploadBtn {
          background: #16a34a;
          color: white;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-block;
          margin: 10px 0;
        }

        .preview {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .imgBox {
          position: relative;
        }

        .previewMedia {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          object-fit: cover;
        }

        .imgBox button {
          position: absolute;
          top: -6px;
          right: -6px;
          background: red;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 12px;
          cursor: pointer;
        }

        .submit {
          width: 100%;
          background: #16a34a;
          color: white;
          padding: 12px;
          border-radius: 12px;
          margin-top: 10px;
        }

        .duration {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 10px;
        }
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
  );
}
