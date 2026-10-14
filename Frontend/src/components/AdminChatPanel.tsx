import { useEffect, useRef, useState } from "react";
import {
    chatStore,
    subscribeChat,
    type ChatSession,
} from "../services/chatStore";

export default function AdminChatPanel() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [text, setText] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    const refresh = () => {
        const list = chatStore.list();
        setSessions([...list]);
        // Auto-select newest pending if nothing selected
        setActiveId((prev) => {
            if (prev && list.some((s) => s.id === prev)) return prev;
            const pending = list.find((s) => s.status === "pending");
            if (pending) return pending.id;
            return list[0]?.id ?? null;
        });
    };

    useEffect(() => {
        refresh();
        const unsub = subscribeChat(refresh);
        const t = setInterval(refresh, 2000);
        return () => {
            unsub();
            clearInterval(t);
        };
    }, []);

    const active = sessions.find((s) => s.id === activeId) || null;

    useEffect(() => {
        const el = endRef.current;
        if (!el) return;
        const box = el.parentElement;
        if (box) box.scrollTop = box.scrollHeight;
    }, [active?.messages?.length, activeId]);

    const send = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeId || !text.trim()) return;
        chatStore.send(activeId, "admin", text.trim());
        setText("");
        refresh();
    };

    return (
        <div
            className="admin-chat-panel"
            style={{
                display: "grid",
                gridTemplateColumns: "min(300px, 34%) 1fr",
                minHeight: 480,
                borderRadius: 18,
                border: "1px solid rgba(96, 165, 250, 0.35)",
                background: "linear-gradient(165deg, #1e293b, #0f172a)",
                overflow: "hidden",
            }}
        >
            <div
                className="admin-chat-list"
                style={{
                    borderRight: "1px solid rgba(96, 165, 250, 0.2)",
                    padding: 16,
                    background: "rgba(0,0,0,0.25)",
                    overflowY: "auto",
                    maxHeight: 560,
                }}
            >
                <h3 style={{ margin: "0 0 6px", color: "#f8fafc", fontSize: 15 }}>
                    User chat requests
                </h3>
                <p style={{ margin: "0 0 14px", fontSize: 12, color: "#94a3b8" }}>
                    {sessions.length} session{sessions.length === 1 ? "" : "s"} ·{" "}
                    {chatStore.pendingCount()} pending
                </p>

                {sessions.length === 0 && (
                    <div
                        style={{
                            padding: 16,
                            borderRadius: 12,
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(248,113,113,0.3)",
                            color: "#fca5a5",
                            fontSize: 13,
                            lineHeight: 1.45,
                        }}
                    >
                        No requests yet. Ask a user to open{" "}
                        <strong>Admin Chat → Request admin chat</strong> (same
                        browser), then this list will fill automatically.
                    </div>
                )}

                {sessions.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveId(s.id)}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: 3,
                            width: "100%",
                            textAlign: "left",
                            padding: "12px 12px",
                            marginBottom: 8,
                            borderRadius: 12,
                            cursor: "pointer",
                            border:
                                activeId === s.id
                                    ? "1px solid rgba(34,211,238,0.55)"
                                    : "1px solid rgba(148,163,184,0.15)",
                            background:
                                activeId === s.id
                                    ? "rgba(37,99,235,0.25)"
                                    : "rgba(255,255,255,0.04)",
                            color: "#f8fafc",
                        }}
                    >
                        <strong style={{ fontSize: 13 }}>
                            {s.userName || "User"}
                        </strong>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {s.userEmail}
                        </span>
                        <em
                            style={{
                                fontStyle: "normal",
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                marginTop: 4,
                                color:
                                    s.status === "pending"
                                        ? "#fbbf24"
                                        : s.status === "accepted"
                                          ? "#22d3ee"
                                          : "#f87171",
                            }}
                        >
                            {s.status}
                        </em>
                    </button>
                ))}
            </div>

            <div
                className="admin-chat-thread"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 480,
                }}
            >
                {!active && (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            fontSize: 14,
                            padding: 24,
                            textAlign: "center",
                        }}
                    >
                        Select a user session from the left to review and reply.
                    </div>
                )}

                {active && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                padding: "14px 16px",
                                borderBottom: "1px solid rgba(96,165,250,0.2)",
                            }}
                        >
                            <div>
                                <strong
                                    style={{
                                        display: "block",
                                        color: "#f8fafc",
                                    }}
                                >
                                    {active.userName}
                                </strong>
                                <span style={{ fontSize: 12, color: "#67e8f9" }}>
                                    {active.userEmail} · {active.status}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                {active.status === "pending" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                chatStore.setStatus(
                                                    active.id,
                                                    "accepted"
                                                );
                                                refresh();
                                            }}
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: 10,
                                                border: "none",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                cursor: "pointer",
                                                background:
                                                    "linear-gradient(135deg,#2563eb,#06b6d4)",
                                                color: "#fff",
                                            }}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                chatStore.setStatus(
                                                    active.id,
                                                    "rejected"
                                                );
                                                refresh();
                                            }}
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: 10,
                                                border: "1px solid rgba(239,68,68,0.4)",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                cursor: "pointer",
                                                background:
                                                    "rgba(239,68,68,0.15)",
                                                color: "#fca5a5",
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {active.status === "accepted" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            chatStore.setStatus(
                                                active.id,
                                                "closed"
                                            );
                                            refresh();
                                        }}
                                        style={{
                                            padding: "8px 14px",
                                            borderRadius: 10,
                                            border: "1px solid rgba(239,68,68,0.4)",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            cursor: "pointer",
                                            background: "rgba(239,68,68,0.15)",
                                            color: "#fca5a5",
                                        }}
                                    >
                                        Close chat
                                    </button>
                                )}
                            </div>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                maxHeight: 360,
                            }}
                        >
                            {active.messages.map((m) => (
                                <div
                                    key={m.id}
                                    style={{
                                        maxWidth: "78%",
                                        alignSelf:
                                            m.from === "admin"
                                                ? "flex-end"
                                                : "flex-start",
                                        padding: "10px 14px",
                                        borderRadius: 14,
                                        fontSize: 13,
                                        background:
                                            m.from === "admin"
                                                ? "linear-gradient(135deg,rgba(37,99,235,0.45),rgba(6,182,212,0.35))"
                                                : "rgba(255,255,255,0.06)",
                                        border:
                                            m.from === "admin"
                                                ? "1px solid rgba(34,211,238,0.3)"
                                                : "1px solid rgba(255,255,255,0.08)",
                                        color: "#f8fafc",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            opacity: 0.7,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {m.from === "admin" ? "You" : "User"}
                                    </span>
                                    <p style={{ margin: 0, lineHeight: 1.45 }}>
                                        {m.text}
                                    </p>
                                </div>
                            ))}
                            <div ref={endRef} />
                        </div>

                        {active.status === "accepted" && (
                            <form
                                onSubmit={send}
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    padding: 12,
                                    borderTop:
                                        "1px solid rgba(96,165,250,0.2)",
                                }}
                            >
                                <input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Reply to user…"
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        borderRadius: 12,
                                        border: "1px solid rgba(34,211,238,0.3)",
                                        background: "rgba(0,0,0,0.35)",
                                        color: "#f8fafc",
                                        fontFamily: "inherit",
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        padding: "0 18px",
                                        border: "none",
                                        borderRadius: 12,
                                        background:
                                            "linear-gradient(135deg,#2563eb,#06b6d4)",
                                        color: "#fff",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    Send
                                </button>
                            </form>
                        )}

                        {active.status === "pending" && (
                            <p
                                style={{
                                    margin: 0,
                                    padding: "12px 16px",
                                    fontSize: 13,
                                    color: "#fbbf24",
                                }}
                            >
                                Accept this request to unlock messaging.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
