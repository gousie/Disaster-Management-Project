import { useEffect, useRef, useState } from "react";

export interface AIContext {
    disasters?: Array<{
        title?: string;
        type?: string;
        severity?: string;
        location?: string;
        status?: string;
        latitude?: number | null;
        longitude?: number | null;
        description?: string;
    }>;
    climate?: {
        location?: string;
        temperature?: number;
        humidity?: number;
        windSpeed?: number;
        rainfall?: number;
        condition?: string;
    } | null;
}

interface Msg {
    id: string;
    role: "user" | "assistant";
    text: string;
}

function buildReply(input: string, ctx: AIContext): string {
    const q = input.toLowerCase().trim();
    const active = (ctx.disasters || []).filter(
        (d) => (d.status || "").toUpperCase() === "ACTIVE"
    );
    const climate = ctx.climate;

    if (/hello|hi |hey|greet|who are you|what are you/.test(q)) {
        return (
            "I'm **AI Assistance** — your DISASTRA intelligence layer.\n\n" +
            "Ask me about:\n" +
            "• Active disaster locations & severity\n" +
            "• Climate (temperature, humidity, wind, rainfall)\n" +
            "• Safety tips by disaster type\n" +
            "• Map coordinates for incidents\n\n" +
            "Try: *Where are active disasters?* or *What's the temperature?*"
        );
    }

    if (/temp|temperature|hot|cold|climate|weather|humidity|wind|rain/.test(q)) {
        if (!climate) {
            return "Climate feed is offline right now. Select a location above or ensure `/api/climate` is running.";
        }
        return (
            `**Regional climate snapshot**\n\n` +
            `• Location: ${climate.location || "Selected region"}\n` +
            `• Temperature: **${climate.temperature}°C**\n` +
            `• Humidity: **${climate.humidity}%**\n` +
            `• Wind: **${climate.windSpeed} km/h**\n` +
            `• Rainfall: **${climate.rainfall} mm**\n` +
            `• Condition: **${climate.condition || "—"}**\n\n` +
            (Number(climate.rainfall) > 20
                ? "Elevated rainfall — flood watch advised for low-lying areas."
                : Number(climate.windSpeed) > 40
                  ? "High wind — secure loose structures."
                  : "Conditions look manageable. Stay alert to official alerts.")
        );
    }

    if (/where|location|map|coordinate|lat|long|active disaster|disaster/.test(q)) {
        if (active.length === 0) {
            return "No **ACTIVE** disasters are currently mapped. Submit a report for admin review.";
        }
        const lines = active.slice(0, 8).map((d, i) => {
            const coords =
                typeof d.latitude === "number" && typeof d.longitude === "number"
                    ? `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`
                    : "coords not set";
            return (
                `${i + 1}. **${d.title || "Incident"}** (${d.type || "?"})\n` +
                `   Severity: ${d.severity || "—"} · ${d.location || "Unknown"}\n` +
                `   Map: ${coords}`
            );
        });
        return (
            `**Active incidents (${active.length})**\n\n` +
            lines.join("\n\n") +
            `\n\nOpen **Live Map** for severity-colored pins.`
        );
    }

    if (/flood|cyclone|earthquake|fire|landslide|drought|safety|tip|evacuat/.test(q)) {
        const tips: Record<string, string> = {
            flood: "**Flood safety**\n• Move to higher ground\n• Avoid flood water\n• Follow evacuation orders",
            cyclone: "**Cyclone / storm**\n• Stay indoors\n• Secure outdoor objects\n• Keep emergency kit ready",
            earthquake: "**Earthquake**\n• Drop, Cover, Hold On\n• Stay away from glass\n• Use stairs, not elevators",
            fire: "**Fire**\n• Evacuate; do not re-enter\n• Stay low under smoke\n• Call emergency services",
            landslide: "**Landslide**\n• Move away from debris path\n• Avoid valleys in heavy rain",
            drought: "**Drought**\n• Conserve water\n• Watch for heat illness",
        };
        for (const key of Object.keys(tips)) {
            if (q.includes(key)) return tips[key];
        }
        return tips.flood + "\n\nAsk about: flood, cyclone, earthquake, fire, landslide, drought.";
    }

    if (/help|what can|commands|menu/.test(q)) {
        return (
            "**Commands**\n• `climate` / `temperature`\n• `where are disasters`\n• `flood tips`\n• `summary`\n\n" +
            "I use live DISASTRA data from your session."
        );
    }

    if (/summary|brief|status|overview|report/.test(q)) {
        const crit = active.filter((d) =>
            (d.severity || "").toUpperCase().includes("CRIT")
        ).length;
        return (
            `**DISASTRA briefing**\n\n` +
            `• Active incidents: **${active.length}**\n` +
            `• Critical severity: **${crit}**\n` +
            (climate
                ? `• Temp **${climate.temperature}°C** · Humidity **${climate.humidity}%** · ${climate.condition}\n`
                : `• Climate: unavailable\n`) +
            `\nAsk a follow-up about any location or hazard.`
        );
    }

    const hit = active.find(
        (d) =>
            d.location &&
            q.includes(String(d.location).toLowerCase().split(",")[0].trim())
    );
    if (hit) {
        return (
            `**${hit.title}** near **${hit.location}**\n` +
            `Type: ${hit.type} · Severity: ${hit.severity} · Status: ${hit.status}\n\n` +
            `${hit.description || "No extended description."}`
        );
    }

    return (
        "Try asking about **temperature**, **active disasters**, **map locations**, or **safety tips**.\n\n" +
        `Tracking **${active.length}** active incident(s)` +
        (climate ? ` · climate **${climate.temperature}°C**` : "") +
        "."
    );
}

interface Props {
    context: AIContext;
    compact?: boolean;
}

export default function AIAssist({ context, compact }: Props) {
    const [open, setOpen] = useState(!compact);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([
        {
            id: "welcome",
            role: "assistant",
            text: "AI Assistance online. Ask about **disaster locations**, **severity**, **climate**, and **safety guidance**.",
        },
    ]);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = endRef.current;
        if (!el) return;
        const box = el.parentElement;
        if (box) box.scrollTop = box.scrollHeight;
    }, [msgs.length, open]);

    const send = () => {
        const text = input.trim();
        if (!text || busy) return;
        setInput("");
        setMsgs((m) => [...m, { id: `u_${Date.now()}`, role: "user", text }]);
        setBusy(true);
        setTimeout(() => {
            const reply = buildReply(text, context);
            setMsgs((m) => [
                ...m,
                { id: `a_${Date.now()}`, role: "assistant", text: reply },
            ]);
            setBusy(false);
        }, 400 + Math.random() * 350);
    };

    const renderText = (text: string) =>
        text.split("\n").map((line, i) => {
            const html = line
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/`(.+?)`/g, "<code>$1</code>");
            return (
                <span
                    key={i}
                    dangerouslySetInnerHTML={{
                        __html: html + (i < text.split("\n").length - 1 ? "<br/>" : ""),
                    }}
                />
            );
        });

    if (compact && !open) {
        return (
            <button
                type="button"
                className="ai-fab"
                onClick={() => setOpen(true)}
                title="Open AI Assistance"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z"
                        fill="currentColor"
                    />
                    <path
                        d="M6 14h12a2 2 0 012 2v1a5 5 0 01-5 5H9a5 5 0 01-5-5v-1a2 2 0 012-2z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                    />
                </svg>
                <span>AI Assist</span>
            </button>
        );
    }

    return (
        <div className={`ai-panel ${compact ? "ai-floating" : ""}`}>
            <div className="ai-header">
                <div className="ai-avatar">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="url(#aiG)" />
                        <path
                            d="M8 13c1.5 2 6.5 2 8 0M9 9.5h.01M15 9.5h.01"
                            stroke="#0b1220"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="aiG" x1="4" y1="4" x2="20" y2="20">
                                <stop stopColor="#22d3ee" />
                                <stop offset="1" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div>
                    <strong>AI Assistance</strong>
                    <span>Live disaster intelligence</span>
                </div>
                {compact && (
                    <button type="button" className="ai-close" onClick={() => setOpen(false)}>
                        ×
                    </button>
                )}
            </div>

            <div className="ai-messages">
                {msgs.map((m) => (
                    <div key={m.id} className={`ai-msg ${m.role}`}>
                        <div className="ai-bubble">{renderText(m.text)}</div>
                    </div>
                ))}
                {busy && (
                    <div className="ai-msg assistant">
                        <div className="ai-bubble typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <div className="ai-quick">
                {["Active disasters", "Temperature", "Safety tips", "Summary"].map((q) => (
                    <button
                        key={q}
                        type="button"
                        onClick={() => {
                            setMsgs((m) => [
                                ...m,
                                { id: `u_${Date.now()}`, role: "user", text: q },
                                {
                                    id: `a_${Date.now()}`,
                                    role: "assistant",
                                    text: buildReply(q, context),
                                },
                            ]);
                        }}
                    >
                        {q}
                    </button>
                ))}
            </div>

            <form
                className="ai-input-row"
                onSubmit={(e) => {
                    e.preventDefault();
                    send();
                }}
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about locations, climate, safety…"
                    disabled={busy}
                />
                <button type="submit" disabled={busy || !input.trim()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </form>
        </div>
    );
}
