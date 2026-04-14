import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { publicId, folderPath, resourceType } = await req.json();

    // 🔥 CASE 1: FULL FOLDER DELETE
    if (folderPath) {
      console.log("🔥 Deleting FULL folder:", folderPath);

      await cloudinary.api.delete_resources_by_prefix(folderPath, {
        resource_type: "image",
        type: "upload",
      });

      await cloudinary.api.delete_resources_by_prefix(folderPath, {
        resource_type: "video",
        type: "upload", 
      });
      await new Promise((res) => setTimeout(res, 500));

      await cloudinary.api.delete_folder(folderPath);

      return NextResponse.json({ success: true });
    }

    // 🔥 CASE 2: SINGLE FILE DELETE
    if (publicId) {
      console.log("🔥 Deleting single:", publicId);

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType || "image",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No data provided" }, { status: 400 });

  } catch (error) {
    console.log("❌ DELETE ERROR:", error);
    return NextResponse.json({ success: false, error });
  }
}