export const uploadImages = async (files: File[], plantName: string) => {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB


  const uploadFile = async (file: File) => {
    const isVideo = file.type.startsWith("video");
    const isImage = file.type.startsWith("image");

    // ✅ Image size check (only addition)
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new Error(`${file.name} exceeds 10MB limit`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    formData.append("folder", `plants/${plantName}`);

    try {
        const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

      const res = await fetch(
       `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${isVideo ? "video" : "image"}/upload` ,
        {
          method: "POST",
          body: formData,
           signal: controller.signal,
        }
        
      );
  clearTimeout(timeout);
  


      // ✅ better error visibility
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Upload failed for ${file.name}: ${errText}`);
      }
const data = await res.json(); 

// ✅ NOW it's valid
console.log("Uploaded URL:", data.secure_url);

      if (!data.secure_url) {
        throw new Error(`No URL returned for ${file.name}`);
      }

      return data.secure_url as string;
    } catch (err: any) {
      // ✅ catch network errors like "Failed to fetch"
      throw new Error(`Error uploading ${file.name}: ${err?.message || err}`);
    }
    
  };


// ✅ retry wrapper added - new
const uploadWithRetry = async (file: File, retries = 2): Promise<string> => {
  try {
    return await uploadFile(file);
  } catch (err) {
    if (retries === 0) throw err;
    return uploadWithRetry(file, retries - 1);
  }
};

  const results: string[] = [];

  for (const file of files) {
    const url = await uploadWithRetry(file);
    results.push(url);
  }
  

  return results;
};



export const deleteImage = async (url: string) => {
  try {
    // ✅ safer publicId extraction
    const parts = url.split("/upload/")[1].split("/");
    
    // remove version (v123456)
    if (parts[0].startsWith("v")) {
      parts.shift();
    }

    let publicId = parts.join("/");

    // remove extension
    publicId = publicId.substring(0, publicId.lastIndexOf("."));

    // ✅ detect resource type from URL
    const isVideo = url.match(/\.(mp4|webm|mov|avi)$/i);

   // ✅ folder extract
const folderPath = publicId.substring(0, publicId.lastIndexOf("/"));

// ✅ API call
await fetch("/api/delete-image", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    publicId,
   
    resourceType: isVideo ? "video" : "image",
  }),
});

  } catch (e) {
    console.log("Delete failed", e);
  }
};

export const uploadPheImages = async (files: File[], name: string) => {
  
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    // 🔥 folder per phe
    formData.append("folder", `phe/${name}`);

    // ✅ detect type
    const isVideo = file.type.startsWith("video");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${isVideo ? "video" : "image"}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error(`Cloudinary upload failed for ${file.name}`);
    }

    const data = await res.json();

    if (!data.secure_url) {
      throw new Error(`Cloudinary did not return a URL for ${file.name}`);
    }

    return data.secure_url as string;
  };

  return Promise.all(files.map(uploadFile));
};
export const deletePheImage = async (url: string) => {
  try {
    // ✅ safer publicId extraction
    const parts = url.split("/upload/")[1].split("/");

    // remove version (v123456)
    if (parts[0].startsWith("v")) {
      parts.shift();
    }

    let publicId = parts.join("/");

    // remove extension
    publicId = publicId.substring(0, publicId.lastIndexOf("."));

    // ✅ detect resource type from URL
    const isVideo = url.match(/\.(mp4|webm|mov|avi)$/i);

    // ✅ API call
    await fetch("/api/delete-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicId,
        resourceType: isVideo ? "video" : "image",
      }),
    });

  } catch (e) {
    console.log("PHE Delete failed", e);
  }
};

export const deletePheFolder = async (name: string) => {
  try {
    await fetch("/api/delete-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folderPath: `phe/${name}`,
      }),
    });
  } catch (e) {
    console.log("Folder delete failed", e);
  }
};