import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Detect resource type from URL extension
function getResourceType(url: string): "image" | "video" {
  if (/\.(mp4|webm|mov|avi|mkv)$/i.test(url)) return "video";
  return "image";
}

// Extract public_id from Cloudinary URL (handles version + URL encoding)
function extractPublicId(url: string): string {
  const urlObj = new URL(url);
  const pathname = decodeURIComponent(urlObj.pathname);
  let parts = pathname.split("/upload/")[1].split("/");
  if (parts[0].startsWith("v")) parts.shift(); // remove version like v1234567
  return parts.join("/").replace(/\.[^/.]+$/, ""); // remove extension
}

// ─────────────────────────────────────────────────────────────────
// WHY NOT use public_id: "plants/Akshar/filename" ?
//
// In newer Cloudinary accounts (Dynamic Folder Mode), slashes in
// public_id do NOT create dashboard folders. The file goes to root.
//
// FIX: Use `folder` + `asset_folder` params SEPARATELY from `public_id`.
// This works correctly in BOTH fixed and dynamic Cloudinary accounts.
// ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { urls, newFolder } = await req.json();

    if (!urls?.length || !newFolder) {
      return NextResponse.json({ success: false, error: "Missing urls or newFolder" });
    }

    const updatedUrls: string[] = [];
    let oldFolder: string | null = null;

    for (const url of urls) {
      const resourceType = getResourceType(url);
      const oldPublicId = extractPublicId(url);

      // Extract just the filename (no folder path)
      const fileName = oldPublicId.split("/").pop()!;

      // Track old folder for cleanup
      if (!oldFolder) {
        const parts = oldPublicId.split("/");
        parts.pop();
        oldFolder = parts.join("/");
      }

      console.log(`📦 [${resourceType}] Moving: ${oldPublicId} → ${newFolder}/${fileName}`);

      try {
        // ✅ CORRECT WAY to upload to a folder in Cloudinary:
        // Pass `folder` and `asset_folder` SEPARATELY from `public_id`
        // DO NOT put slashes in public_id — that doesn't create folders in newer accounts
        const uploadResult = await cloudinary.uploader.upload(url, {
          folder: newFolder,         // ← creates folder in dashboard (fixed folder mode)
          asset_folder: newFolder,   // ← creates folder in dashboard (dynamic folder mode)
          public_id: fileName,       // ← just the filename, NO slashes
          resource_type: resourceType,
          overwrite: true,
          invalidate: true,
          use_filename: false,
          unique_filename: false,
        });

        console.log(`✅ Uploaded to: ${uploadResult.secure_url}`);

        // Delete file from old location
        const destroyResult = await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: resourceType,
          invalidate: true,
        });

        console.log(`🗑️ Deleted old file (${oldPublicId}): result=${destroyResult.result}`);
        updatedUrls.push(uploadResult.secure_url);

      } catch (fileErr) {
        console.error(`❌ Failed to move ${oldPublicId}:`, fileErr);
        updatedUrls.push(url); // keep original URL if this file failed
      }
    }

    // Delete old empty folder (best effort)
    if (oldFolder && oldFolder !== newFolder) {
      try {
        await cloudinary.api.delete_folder(oldFolder);
        console.log(`🗑️ Deleted old folder: ${oldFolder}`);
      } catch (folderErr) {
        console.log(`ℹ️ Old folder not deleted (may have other files):`, folderErr);
      }
    }

    return NextResponse.json({ success: true, urls: updatedUrls });

  } catch (err) {
    console.error("MOVE ERROR", err);
    return NextResponse.json({ success: false, error: String(err) });
  }
}