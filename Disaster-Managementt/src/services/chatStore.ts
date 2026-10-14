/** Chat store with localStorage + cross-tab / same-tab sync events */

export type ChatRequestStatus = "pending" | "accepted" | "rejected" | "closed";

export interface ChatMessage {
    id: string;
    from: "user" | "admin";
    text: string;
    at: string;
}

export interface ChatSession {
    id: string;
    userName: string;
    userEmail: string;
    status: ChatRequestStatus;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

const KEY = "disastra_chat_sessions_v1";
const EVENT = "disastra-chat-updated";

function load(): ChatSession[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? (data as ChatSession[]) : [];
    } catch {
        return [];
    }
}

function save(sessions: ChatSession[]) {
    localStorage.setItem(KEY, JSON.stringify(sessions));
    // same-tab listeners
    try {
        window.dispatchEvent(new CustomEvent(EVENT));
    } catch {
        /* */
    }
}

function uid() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Subscribe to chat changes (same tab + other tabs) */
export function subscribeChat(cb: () => void): () => void {
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

export const chatStore = {
    list(): ChatSession[] {
        return load().sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
        );
    },

    get(id: string): ChatSession | undefined {
        return load().find((s) => s.id === id);
    },

    getForUser(email: string): ChatSession | undefined {
        const e = (email || "").trim().toLowerCase();
        return load()
            .filter((s) => (s.userEmail || "").trim().toLowerCase() === e)
            .sort(
                (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
            )[0];
    },

    requestChat(userName: string, userEmail: string): ChatSession {
        const sessions = load();
        const email = (userEmail || "user@disastra.local").trim();
        const name = (userName || "User").trim() || "User";

        const existing = sessions.find(
            (s) =>
                (s.userEmail || "").trim().toLowerCase() ===
                    email.toLowerCase() &&
                (s.status === "pending" || s.status === "accepted")
        );
        if (existing) return existing;

        const session: ChatSession = {
            id: uid(),
            userName: name,
            userEmail: email,
            status: "pending",
            messages: [
                {
                    id: uid(),
                    from: "user",
                    text: "Hello Admin, I would like to discuss a disaster situation.",
                    at: new Date().toISOString(),
                },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        sessions.push(session);
        save(sessions);
        return session;
    },

    setStatus(id: string, status: ChatRequestStatus): ChatSession | undefined {
        const sessions = load();
        const i = sessions.findIndex((s) => s.id === id);
        if (i < 0) return undefined;
        sessions[i] = {
            ...sessions[i],
            status,
            updatedAt: new Date().toISOString(),
            messages: [
                ...sessions[i].messages,
                {
                    id: uid(),
                    from: "admin",
                    text:
                        status === "accepted"
                            ? "Chat request accepted. How can I help you?"
                            : status === "rejected"
                              ? "Chat request was declined. Please use the report form or try again later."
                              : "This chat has been closed by admin.",
                    at: new Date().toISOString(),
                },
            ],
        };
        save(sessions);
        return sessions[i];
    },

    send(
        id: string,
        from: "user" | "admin",
        text: string
    ): ChatSession | undefined {
        const sessions = load();
        const i = sessions.findIndex((s) => s.id === id);
        if (i < 0) return undefined;
        if (sessions[i].status !== "accepted") return sessions[i];
        sessions[i] = {
            ...sessions[i],
            updatedAt: new Date().toISOString(),
            messages: [
                ...sessions[i].messages,
                {
                    id: uid(),
                    from,
                    text: text.trim(),
                    at: new Date().toISOString(),
                },
            ],
        };
        save(sessions);
        return sessions[i];
    },

    pendingCount(): number {
        return load().filter((s) => s.status === "pending").length;
    },
};
