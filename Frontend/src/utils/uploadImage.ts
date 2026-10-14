import api from "../api/api";

const API_ORIGIN =
  (import.meta.env.VITE_API_URL || "http://localhost:8081/api").replace(
    /\/api\/?$/,
    ""
  );

/**
 * Upload an image file to the backend and return a permanent URL.
 * Avoids storing huge data-URLs in the database / localStorage
 * (which was causing images to "backtrack" to random fallbacks).
 */
export async function uploadImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  // Cap very large files client-side (backend also has 100MB limit)
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Image is too large (max 15 MB). Please choose a smaller file.");
  }

  const form = new FormData();
  form.append("file", file);

  const res = await api.post("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const data = res.data || {};
  // Prefer absolute URL so <img src> works from any origin
  let url: string =
    data.url ||
    (data.fileUrl
      ? data.fileUrl.startsWith("http")
        ? data.fileUrl
        : `${API_ORIGIN}${data.fileUrl}`
      : "");

  if (!url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return url;
}

/** Resolve a relative /uploads/... path to absolute backend URL */
export function absoluteMediaUrl(url?: string | null): string {
  if (!url) return "";
  const u = url.trim();
  if (!u) return "";
  if (u.startsWith("data:") || u.startsWith("blob:") || u.startsWith("http")) {
    return u;
  }
  if (u.startsWith("/")) {
    return `${API_ORIGIN}${u}`;
  }
  return u;
}
