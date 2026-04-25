"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadImages } from "@/lib/cloudinary";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";


type PlantForm = {
  category: string;
  name: string;
  images: File[];

  flowerType: string;
  flowerDuration: string; // ✅ KEEP
  flowerColor: string;

  hedge: string; // ✅ KEEP
  heightFt: string;

  widthFt: string;


  shape: string;
  uses: string;

  shade: string;
  water: string;

  variety: string;
};

export default function AddPlant() {
  const router = useRouter();

  const [form, setForm] = useState<PlantForm>({
    category: "Tree",
    name: "",
    images: [],

    flowerType: "",
    flowerDuration: "", // ✅ KEEP
    flowerColor: "",

    hedge: "", // ✅ KEEP
    heightFt: "",

    widthFt: "",


    shape: "",
    uses: "",

    shade: "",
    water: "",

    variety: "",
  });

  const [preview, setPreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [durations, setDurations] = useState<number[]>([]);
  const handleChange = <K extends keyof PlantForm>(
    key: K,
    value: PlantForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = async (files: FileList | null) => {
    if (!files) return;

    const heic2any = (await import("heic2any")).default; // ✅ FIX


    const arr = Array.from(files);
    let processedFiles: File[] = [];
    for (const file of arr) {
      // ✅ HEIC detect
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
        }
      } else {
        processedFiles.push(file);
      }
    }


    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...processedFiles],
    }));

    const urls = processedFiles.map((file) => URL.createObjectURL(file));
    setPreview((prev) => [...prev, ...urls]);
  };

  const removeImage = (index: number) => {
    const url = preview[index];


    const newImages = form.images.filter((_, i) => i !== index);
    const newPreview = preview.filter((_, i) => i !== index);

    setForm((prev) => ({ ...prev, images: newImages }));
    setPreview(newPreview);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert("❌ Enter plant name first");
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages(form.images, form.name);

      const { error } = await supabase.from("plants").insert([
        {
          category: form.category,
          name: form.name,
          images: imageUrls,

          flower_type: form.flowerType,
          flower_duration: form.flowerDuration, // ✅ KEEP
          flower_color: form.flowerColor,

          hedge: form.hedge, // ✅ KEEP
          height_ft: form.heightFt,

          width_ft: form.widthFt,


          shape: form.shape,
          uses: form.uses,

          shade: form.shade,
          water: form.water,

          variety: form.variety,
        },
      ]);
      console.log("ERROR:", error);

      if (error) {
        alert("❌ Error saving plant");
        return;
      }

      alert("🌱 Plant Added!");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Error uploading images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

const editor = useEditor({
  extensions: [
    StarterKit,
    TextStyle,
    Color.configure({ types: ["textStyle"] }),
     Highlight,
  ],  
  content: form.uses,
  immediatelyRender: false, // ✅ FIX
  onUpdate: ({ editor }) => {
    handleChange("uses", editor.getHTML());
  },
});

  return (
    <div className="container">
      <h1 className="title">🌱 Add Plant</h1>

      <div className="flex flex-col gap-4">
        <div className="field">
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="p-2 border rounded-xl"
          >
            <option value="">All Category</option>

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
            <option>Extra 1  ( વધારા ના 1 )</option>
            <option>Extra 2  ( વધારા ના 2 )</option>
          </select>
        </div>

        <div className="field">
          <label>Plant Name</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

      </div>

      <label className="uploadBtn">
        📤 Upload Images / Videos
        <input
          type="file"
          multiple
          accept="image/*,image/heic,video/*"
          hidden
          onChange={(e) => handleImageChange(e.target.files)}
        />
      </label>

      <div className="preview">
        {preview.map((file, i) => {
          const isVideo = file.startsWith("blob:")
            ? form.images[i]?.type.startsWith("video")
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
                      ? `${Math.floor(durations[i] / 60)}:${Math.floor(durations[i] % 60)
                        .toString()
                        .padStart(2, "0")}`
                      : "Loading..."}
                  </div>
                </>
              ) : (
                <img src={file} className="previewMedia" />
              )}

              <button onClick={() => removeImage(i)}>✕</button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {/* FLOWER */}
        <div className="field">
          <label>Flower / Non-Flower</label>
          <select
            value={form.flowerType}
            onChange={(e) => handleChange("flowerType", e.target.value)}
          >
            <option value="">Select</option>
            <option>Flowering</option>
            <option>Non-Flowering</option>
          </select>
        </div>

        {form.flowerType === "Flowering" && (
          <>
            <div className="field">
              <label>Flower Color</label>
              <input
                value={form.flowerColor}
                onChange={(e) =>
                  handleChange("flowerColor", e.target.value)
                }
              />
            </div>

            <div className="field">
              <label>Flowering Season</label>
              <select
                value={form.flowerDuration}
                onChange={(e) =>
                  handleChange("flowerDuration", e.target.value)
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
        <div className="grid">
          <div className="field">
            <label>Height (ft)</label>
            <input
              value={form.heightFt}
              onChange={(e) => handleChange("heightFt", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Width (ft)</label>
            <input
              value={form.widthFt}
              onChange={(e) => handleChange("widthFt", e.target.value)}
            />
          </div>
        </div>
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

        {/* HEDGE (KEPT) */}
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


        {/* EXTRA */}



        {/* WATER */}
        <div className="field">
          <label>Water Requirement</label>
          <select
            value={form.water}
            onChange={(e) => handleChange("water", e.target.value)}
          >
            <option value="">Select</option>
            <option>Normal / Moderate </option>
            <option>More Water </option>
            <option>Less Water </option>
          </select>
        </div>

        {/* Purpose */}
 <div className="field">
  <label className="text-green-700 font-semibold mb-2">
    Description / Uses
  </label>

  {editor && (
    <div className="rounded-xl border border-green-300 bg-white shadow-sm">

      {/* 🔥 Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-green-50">

        {/* Text buttons */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive("bold")
              ? "bg-green-200 text-green-900"
              : "bg-white border"
          }`}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive("italic")
              ? "bg-green-200 text-green-900"
              : "bg-white border"
          }`}
        >
          I
        </button>

<button
  type="button"
  onClick={() => {
    if (editor.isActive("highlight")) {
      editor.chain().focus().unsetHighlight().run(); // 🔴 remove
    } else {
      editor
        .chain()
        .focus()
        .toggleHighlight({ color: "#fde047" }) // 🟡 apply
        .run();
    }
  }}
  className={`px-2 py-1 rounded ${
    editor.isActive("highlight")
      ? "bg-yellow-400 text-green-900"
      : "bg-yellow-200"
  }`}
>
  🖍
</button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-300 mx-1" />

        
      </div>

      {/* ✏️ Editor */}
      <div className="p-3 min-h-[120px] text-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  )}
</div>
</div>

      <button onClick={handleSubmit} disabled={loading} className="submit">
        {loading ? "Saving..." : "🌿 Save Plant"}
      </button>

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
.ProseMirror {
  outline: none;
  min-height: 100px;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
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
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
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

        .imgBox img {
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
          .previewMedia {
            width: 80px;
            height: 80px;
           border-radius: 10px;
           object-fit: cover;
      }
           .duration {
            position: absolute;
            bottom: 2px;
            right: 4px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 10px;
}
      
      `}</style>
    </div>
  );
}
