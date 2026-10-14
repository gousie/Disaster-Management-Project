/** Extra post details + gallery images */

import { broadcastLive } from "./liveSync";

export interface DisasterExtras {
    extraDetails: string;
    gallery: string[];
}

const KEY = "disastra_disaster_extras_v1";
const EVENT = "disastra-extras-updated";

type Map = Record<string, DisasterExtras>;

function load(): Map {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return {};
        const data = JSON.parse(raw);
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

function save(map: Map) {
    localStorage.setItem(KEY, JSON.stringify(map));
    try {
        window.dispatchEvent(new CustomEvent(EVENT));
        broadcastLive("extras");
    } catch {
        /* */
    }
}

function keyOf(id: number | string | undefined | null): string {
    if (id === undefined || id === null) return "";
    return String(id).trim();
}

export function getExtras(id: number | string | undefined | null): DisasterExtras {
    const k = keyOf(id);
    if (!k) return { extraDetails: "", gallery: [] };
    const map = load();
    return map[k] || { extraDetails: "", gallery: [] };
}

export function setExtras(
    id: number | string | undefined | null,
    extras: DisasterExtras,
    title?: string
) {
    const map = load();
    const payload: DisasterExtras = {
        extraDetails: (extras.extraDetails || "").trim(),
        gallery: (extras.gallery || []).filter((u) => u && String(u).trim()),
    };
    const k = keyOf(id);
    if (k) map[k] = payload;
    if (title && title.trim()) {
        map[`title:${title.trim().toLowerCase()}`] = payload;
    }
    save(map);
}

export function subscribeExtras(cb: () => void): () => void {
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
