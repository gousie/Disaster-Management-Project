/**
 * Shared disaster image helper.
 * Use the same function on User and Admin pages.
 *
 * - Uses an uploaded imageUrl when available.
 * - Otherwise selects a stable fallback image by disaster type and ID.
 * - Uses direct image URLs, not Markdown links.
 */

export interface DisasterImageSource {
  id?: number | string | null;
  title?: string;
  type?: string;
  imageUrl?: string | null;
}

const POOLS: Record<string, string[]> = {
  flood: [
    "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?auto=format&fit=crop&w=1600&q=85",
  ],

  cyclone: [
    "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1600&q=85",
  ],

  earthquake: [
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1504718855392-c0f33b372e72?auto=format&fit=crop&w=1600&q=85",
  ],

  fire: [
    "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=85",
  ],

  landslide: [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1600&q=85",
  ],

  drought: [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=85",
  ],

  tsunami: [
    "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=1600&q=85",
  ],

  volcanic: [
    "https://images.unsplash.com/photo-1462331947965-b7d3cd83660a?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1550159930-40066082a4fc?auto=format&fit=crop&w=1600&q=85",
  ],

  other: [
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=85",
  ],
};

/**
 * Match a disaster type to an image pool.
 */
function poolKey(type?: string): string {
  const value = (type || "").trim().toLowerCase();

  if (value.includes("flood") || value.includes("waterlogging")) {
    return "flood";
  }

  if (
    value.includes("cyclone") ||
    value.includes("storm") ||
    value.includes("hurricane") ||
    value.includes("typhoon")
  ) {
    return "cyclone";
  }

  if (value.includes("earthquake") || value.includes("seismic")) {
    return "earthquake";
  }

  if (
    value.includes("fire") ||
    value.includes("wildfire") ||
    value.includes("forest fire")
  ) {
    return "fire";
  }

  if (value.includes("landslide") || value.includes("mudslide")) {
    return "landslide";
  }

  if (value.includes("drought")) {
    return "drought";
  }

  if (value.includes("tsunami")) {
    return "tsunami";
  }

  if (value.includes("volcano") || value.includes("volcanic")) {
    return "volcanic";
  }

  return "other";
}

/**
 * Generate a stable number from a report ID or title.
 */
function seedFrom(disaster: DisasterImageSource): number {
  const identifier = disaster.id;

  if (
    identifier !== undefined &&
    identifier !== null &&
    String(identifier).trim() !== ""
  ) {
    const numericId = Number(identifier);

    if (Number.isFinite(numericId)) {
      return Math.abs(numericId);
    }

    return hashString(String(identifier));
  }

  return hashString(disaster.title || "");
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

/**
 * Normalize common image-sharing URLs.
 * Direct image URLs are returned unchanged.
 */
export function normalizeImageUrl(
  raw?: string | null
): string {
  if (!raw) return "";

  const url = raw.trim();

  if (!url) return "";

  if (url.startsWith("data:image/")) {
    return url;
  }

  if (url.startsWith("blob:")) {
    return url;
  }

  // Google Drive: /file/d/FILE_ID/view
  const driveFile = url.match(
    /drive\.google\.com\/file\/d\/([^/?#]+)/
  );

  if (driveFile?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveFile[1]}`;
  }

  // Google Drive: open?id=FILE_ID
  const driveOpen = url.match(
    /drive\.google\.com\/open\?id=([^&#]+)/
  );

  if (driveOpen?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveOpen[1]}`;
  }

  return url;
}

/**
 * Return the uploaded image when available.
 * Otherwise return a stable fallback for the report.
 *
 * The optional cacheBust parameter is useful only when you
 * intentionally want to refresh a remote image URL.
 */
export function getDisasterImage(
  disaster: DisasterImageSource,
  cacheBust?: number | string
): string {
  let uploadedImage = normalizeImageUrl(disaster.imageUrl);

  // Make relative /uploads/... paths absolute so they load from the backend
  if (uploadedImage && uploadedImage.startsWith("/uploads/")) {
    const origin = (import.meta as any).env?.VITE_API_URL
      ? String((import.meta as any).env.VITE_API_URL).replace(/\/api\/?$/, "")
      : "http://localhost:8081";
    uploadedImage = origin + uploadedImage;
  }

  // If a real uploaded/pasted image exists, ALWAYS use it — never swap to a random fallback
  if (uploadedImage) {
    if (
      uploadedImage.startsWith("data:") ||
      uploadedImage.startsWith("blob:")
    ) {
      return uploadedImage;
    }

    if (
      cacheBust !== undefined &&
      cacheBust !== null &&
      String(cacheBust) !== ""
    ) {
      const separator = uploadedImage.includes("?") ? "&" : "?";
      return `${uploadedImage}${separator}_cb=${encodeURIComponent(String(cacheBust))}`;
    }

    return uploadedImage;
  }

  // Fallback only when no imageUrl is stored
  const pool = POOLS[poolKey(disaster.type)] || POOLS.other;
  return pool[seedFrom(disaster) % pool.length];
}


/**
 * Convert a selected local image into a compressed data URL.
 * This supports previewing an image before uploading it.
 *
 * Note: a data URL is not persistent storage by itself.
 * The backend must save it or store the image separately.
 */
export function fileToDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Failed to read the selected image."));
    };

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => {
        reject(new Error("The selected image could not be decoded."));
      };

      image.onload = () => {
        let { width, height } = image;

        if (width > maxDimension || height > maxDimension) {
          const scale = Math.min(
            maxDimension / width,
            maxDimension / height
          );

          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not process the selected image."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        try {
          resolve(canvas.toDataURL("image/webp", quality));
        } catch {
          try {
            resolve(canvas.toDataURL("image/jpeg", quality));
          } catch {
            reject(new Error("Could not convert the selected image."));
          }
        }
      };

      image.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  });
}