import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { urls, newFolder } = await req.json();

    const updatedUrls: string[] = [];

    for (const url of urls) {
      const parts = url.split("/upload/")[1].split("/");

      if (parts[0].startsWith("v")) {
        parts.shift();
      }

      let publicId = parts.join("/");
      publicId = publicId.substring(0, publicId.lastIndexOf("."));

      const fileName = publicId.split("/").pop();
      const newPublicId = `${newFolder}/${fileName}`;

      const result = await cloudinary.uploader.rename(
        publicId,
        newPublicId,
        { overwrite: true }
      );

      updatedUrls.push(result.secure_url);
    }

    return NextResponse.json({ success: true, urls: updatedUrls });
  } catch (err) {
    console.log("MOVE ERROR", err);
    return NextResponse.json({ success: false });
  }
}