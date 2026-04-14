export const uploadImages = async (files: File[], plantName: string) => {
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    // folder per plant
    formData.append("folder", `plants/${plantName}`);

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