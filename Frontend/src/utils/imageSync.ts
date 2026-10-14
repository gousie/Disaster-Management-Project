/** Cross-portal image sync via localStorage.
 *  Ensures User and Admin portals always display matching, updated images
 *  even if backend is offline, slow, or omits imageUrl in responses.
 */

import { broadcastLive } from "./liveSync";

const KEY = "disastra_image_map_v2";
const EVENT = "disastra-images-updated";

export type ImageMap = Record<string, string>;

function normalizeTitleKey(title?: string | null): string {
    if (!title) return "";
    return "title:" + title.trim().toLowerCase().replace(/\s+/g, "_");
}

function load(): ImageMap {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return {};
        const data = JSON.parse(raw);
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

function save(map: ImageMap) {
    try {
        localStorage.setItem(KEY, JSON.stringify(map));
        window.dispatchEvent(new CustomEvent(EVENT));
        broadcastLive("images");
    } catch (e) {
        console.warn("Storage quota or error saving image map", e);
    }
}

/** Set image by ID and optionally by Title for universal cross-portal resolution */
export function setDisasterImage(
    id: number | string | undefined | null,
    imageUrl: string,
    title?: string
) {
    const map = load();
    const url = (imageUrl || "").trim();

    if (id !== undefined && id !== null && `${id}` !== "") {
        const key = String(id);
        if (!url) delete map[key];
        else map[key] = url;
    }

    if (title && title.trim()) {
        const tKey = normalizeTitleKey(title);
        if (!url) delete map[tKey];
        else map[tKey] = url;
    }

    save(map);
}

export function getDisasterImageOverride(
    id?: number | string | null,
    title?: string | null
): string {
    const map = load();
    if (id !== undefined && id !== null && `${id}` !== "") {
        const byId = map[String(id)];
        if (byId) return byId;
    }
    if (title && title.trim()) {
        const byTitle = map[normalizeTitleKey(title)];
        if (byTitle) return byTitle;
    }
    return "";
}

export function mergeImageOverrides<T extends { id?: number | string; title?: string; imageUrl?: string }>(
    list: T[]
): T[] {
    const map = load();
    return list.map((d) => {
        let override = "";
        if (d.id !== undefined && d.id !== null && `${d.id}` !== "") {
            override = map[String(d.id)] || "";
        }
        if (!override && d.title && d.title.trim()) {
            override = map[normalizeTitleKey(d.title)] || "";
        }

        if (override && override.trim()) {
            return { ...d, imageUrl: override };
        }
        return d;
    });
}

export function subscribeImages(cb: () => void): () => void {
    const onCustom = () => cb();
    const onStorage = (e: StorageEvent) => {
        if (e.key === KEY || e.key === null) cb();
    };
    window.addEventListener(EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
        window.removeEventListener(EVENT, onCustom);
        window.removeEventListener("storage", onStorage);
    };
}
