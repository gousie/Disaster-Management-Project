/** Instant same-browser sync between Admin and User portals. */

const EVENT = "disastra-live";
const STORAGE_KEY = "disastra_live_tick";
const CHANNEL = "disastra-live-ch";

export function broadcastLive(kind = "all") {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind, t: Date.now() }));
        window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind } }));
        const ch = new BroadcastChannel(CHANNEL);
        ch.postMessage({ kind, t: Date.now() });
        ch.close();
    } catch {
        /* quota / private mode */
    }
}

export function subscribeLive(cb: (kind: string) => void): () => void {
    const onCustom = (e: Event) => {
        const kind = (e as CustomEvent).detail?.kind || "all";
        cb(kind);
    };
    const onStorage = (e: StorageEvent) => {
        if (
            e.key === STORAGE_KEY ||
            e.key === "disastra_image_map_v2" ||
            (e.key && e.key.startsWith("disastra_"))
        ) {
            cb("all");
        }
    };
    let ch: BroadcastChannel | null = null;
    try {
        ch = new BroadcastChannel(CHANNEL);
        ch.onmessage = (m) => cb((m.data && m.data.kind) || "all");
    } catch {
        /* */
    }
    window.addEventListener(EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
        window.removeEventListener(EVENT, onCustom);
        window.removeEventListener("storage", onStorage);
        ch?.close();
    };
}
