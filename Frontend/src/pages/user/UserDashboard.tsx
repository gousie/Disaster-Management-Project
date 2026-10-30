import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import DisasterMap from "../../components/DisasterMap";
import AIAssist from "../../components/AIAssist";
import ThemeToggle from "../../components/ThemeToggle";
import { getExtras } from "../../utils/disasterExtras";
import {
    chatStore,
    subscribeChat,
    type ChatSession,
} from "../../services/chatStore";
import {
    getVideos,
    getWhatsNew,
    getGuidelines,
    getDosDonts,
    getHelplines,
    subscribeContent,
    type AwarenessVideo,
    type WhatsNewItem,
    type GuidelineItem,
    type DosDontsItem,
    type HelplineItem,
} from "../../services/contentStore";
import { getDisasterImage as resolveDisasterImage, normalizeImageUrl, fileToDataUrl } from "../../utils/disasterImages";
import { uploadImageFile, absoluteMediaUrl } from "../../utils/uploadImage";
import { mergeImageOverrides, subscribeImages } from "../../utils/imageSync";
import UserIcon from "../../components/UserIcon";
import "./UserDashboard.css";

interface Disaster {
    id?: number;
    title: string;
    type: string;
    description: string;
    severity: string;
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    status: string;
    imageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface Climate {
    location: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    condition: string;
}

interface ReportForm {
    title: string;
    type: string;
    description: string;
    severity: string;
    location: string;
    latitude: string;
    longitude: string;
    imageUrl: string;
}

const emptyReport: ReportForm = {
    title: "",
    type: "FLOOD",
    description: "",
    severity: "MEDIUM",
    location: "",
    latitude: "",
    longitude: "",
    imageUrl: "",
};

const CLIMATE_LOCATIONS = [
    { name: "Guntur, AP", lat: 16.3067, lng: 80.4365 },
    { name: "Vijayawada, AP", lat: 16.5062, lng: 80.648 },
    { name: "Visakhapatnam, AP", lat: 17.6868, lng: 83.2185 },
    { name: "Hyderabad, TS", lat: 17.385, lng: 78.4867 },
    { name: "Chennai, TN", lat: 13.0827, lng: 80.2707 },
    { name: "Bengaluru, KA", lat: 12.9716, lng: 77.5946 },
    { name: "Mumbai, MH", lat: 19.076, lng: 72.8777 },
    { name: "Delhi, DL", lat: 28.6139, lng: 77.209 },
];

function getStoredUser() {
    try {
        const raw = localStorage.getItem("disastra_user");
        if (raw) return JSON.parse(raw) as { name?: string; email?: string };
    } catch {
        /* */
    }
    return { name: "User", email: "user@disastra.local" };
}

/** Same Alert shape as AdminDashboard — loaded from GET /alerts */
interface AlertMessage {
    id?: number | string;
    title: string;
    message: string;
    severity?: string;
    location?: string;
    active?: boolean;
    createdAt?: string;
}

const ALERTS_READ_KEY = "disastra_alerts_read";

function getReadAlertIds(): Set<string> {
    try {
        const raw = localStorage.getItem(ALERTS_READ_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
        return new Set();
    }
}

function markAlertsRead(ids: string[]) {
    try {
        const prev = getReadAlertIds();
        ids.forEach((id) => prev.add(String(id)));
        localStorage.setItem(ALERTS_READ_KEY, JSON.stringify([...prev]));
    } catch {
        /* */
    }
}

function alertKey(a: AlertMessage): string {
    return String(a.id ?? a.createdAt ?? a.title);
}

/** Same bell shape as admin Icon "notification" */
function NotifBellIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </svg>
    );
}

function SeverityChart({ disasters }: { disasters: Disaster[] }) {
    const levels = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
    const colors: Record<string, string> = {
        CRITICAL: "#ef4444",
        HIGH: "#f97316",
        MEDIUM: "#eab308",
        LOW: "#22d3ee",
    };
    const counts = levels.map(
        (lv) =>
            disasters.filter(
                (d) => (d.severity || "").toUpperCase() === lv
            ).length
    );
    const max = Math.max(...counts, 1);
    const W = 360;
    const H = 160;
    const barW = 48;
    const gap = 28;
    const baseY = 130;
    const startX = 40;

    return (
        <div className="severity-chart-card">
            <div className="chart-head">
                <h3>Disasters by severity level</h3>
                <p>Live distribution of all tracked incidents</p>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="severity-svg" role="img">
                {[0.25, 0.5, 0.75, 1].map((f) => (
                    <line
                        key={f}
                        x1={20}
                        x2={W - 10}
                        y1={baseY - f * 100}
                        y2={baseY - f * 100}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                    />
                ))}
                {levels.map((lv, i) => {
                    const h = (counts[i] / max) * 100;
                    const x = startX + i * (barW + gap);
                    return (
                        <g key={lv}>
                            <rect
                                x={x}
                                y={baseY - h}
                                width={barW}
                                height={Math.max(h, 2)}
                                rx={8}
                                fill={colors[lv]}
                                opacity={0.9}
                            />
                            <text
                                x={x + barW / 2}
                                y={baseY - h - 8}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="12"
                                fontWeight="700"
                            >
                                {counts[i]}
                            </text>
                            <text
                                x={x + barW / 2}
                                y={baseY + 18}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.65)"
                                fontSize="10"
                                fontWeight="600"
                            >
                                {lv}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="chart-legend">
                {levels.map((lv) => (
                    <span key={lv} style={{ color: colors[lv] }}>
                        {lv}: {counts[levels.indexOf(lv)]}
                    </span>
                ))}
            </div>
        </div>
    );
}


function DisasterDetailModal({
    disaster,
    galleryIndex,
    setGalleryIndex,
    onClose,
    getImage,
}: {
    disaster: Disaster;
    galleryIndex: number;
    setGalleryIndex: React.Dispatch<React.SetStateAction<number>>;
    onClose: () => void;
    getImage: (d: Disaster) => string;
}) {
    const extras = getExtras(disaster.id);
    // also try title-based key if id lookup empty
    const extrasByTitle =
        !extras.extraDetails && !(extras.gallery && extras.gallery.length)
            ? getExtras(`title:${(disaster.title || "").trim().toLowerCase()}`)
            : extras;
    const data =
        extras.extraDetails || (extras.gallery && extras.gallery.length)
            ? extras
            : extrasByTitle;

    const main = getImage(disaster);
    const slides = [main, ...(data.gallery || [])].filter(
        (u, i, arr) => u && arr.indexOf(u) === i
    );
    const n = Math.max(slides.length, 1);
    const safeIdx = ((galleryIndex % n) + n) % n;

    return (
        <div className="detail-modal-backdrop" onClick={onClose}>
            <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                <div style={{ position: "relative", background: "#000" }}>
                    <img
                        className="detail-hero"
                        src={slides[safeIdx] || main}
                        alt={disaster.title}
                        style={{ minHeight: 240, width: "100%", objectFit: "cover" }}
                    />
                    <button
                        type="button"
                        onClick={() => setGalleryIndex((i) => i - 1)}
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            borderRadius: 999,
                            width: 40,
                            height: 40,
                            background: "rgba(16,185,129,0.85)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 22,
                            fontWeight: 700,
                            zIndex: 2,
                        }}
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        onClick={() => setGalleryIndex((i) => i + 1)}
                        style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            borderRadius: 999,
                            width: 40,
                            height: 40,
                            background: "rgba(16,185,129,0.85)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 22,
                            fontWeight: 700,
                            zIndex: 2,
                        }}
                    >
                        ›
                    </button>
                    <div
                        style={{
                            position: "absolute",
                            bottom: 12,
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 800,
                            textShadow: "0 2px 8px #000",
                        }}
                    >
                        Photo {safeIdx + 1} / {n}
                    </div>
                </div>
                <div className="detail-modal-body">
                    <h2>{disaster.title}</h2>
                    <div className="detail-meta">
                        <span>{disaster.type}</span>
                        <span>{disaster.severity}</span>
                        <span>{disaster.status}</span>
                        <span>{disaster.location}</span>
                    </div>
                    <p>{disaster.description || "No description provided."}</p>
                    <div
                        style={{
                            marginTop: 12,
                            padding: 14,
                            borderRadius: 12,
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(52,211,153,0.3)",
                        }}
                    >
                        <strong
                            style={{
                                color: "#a7f3d0",
                                fontSize: 12,
                                letterSpacing: "0.06em",
                            }}
                        >
                            EXTRA DETAILS
                        </strong>
                        <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
                            {data.extraDetails ||
                                "No extra details added by admin yet."}
                        </p>
                    </div>
                    <p>
                        <strong>Coordinates:</strong> {disaster.latitude},{" "}
                        {disaster.longitude}
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            overflowX: "auto",
                            margin: "12px 0",
                        }}
                    >
                        {slides.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setGalleryIndex(i)}
                                style={{
                                    padding: 0,
                                    border:
                                        i === safeIdx
                                            ? "2px solid #34d399"
                                            : "2px solid transparent",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={s}
                                    alt=""
                                    style={{
                                        width: 64,
                                        height: 48,
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    <button type="button" className="detail-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}


function UserDashboard() {
    const navigate = useNavigate();
    const user = getStoredUser();

    const [disasters, setDisasters] = useState<Disaster[]>([]);
    const [climate, setClimate] = useState<Climate | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("home");
    const [climateLoc, setClimateLoc] = useState(CLIMATE_LOCATIONS[0]);
    const [climateLoading, setClimateLoading] = useState(false);
    const [liveNews, setLiveNews] = useState<string[]>([]);
    const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
    const [galleryIndex, setGalleryIndex] = useState(0);

    const [report, setReport] = useState<ReportForm>(emptyReport);
    const [submitting, setSubmitting] = useState(false);
    const [reportMsg, setReportMsg] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const [chatSession, setChatSession] = useState<ChatSession | undefined>();
    const [chatText, setChatText] = useState("");
    const [videos, setVideos] = useState<AwarenessVideo[]>(() => getVideos());
    const [whatsNew, setWhatsNew] = useState<WhatsNewItem[]>(() => getWhatsNew());
    const [guidelines, setGuidelinesList] = useState<GuidelineItem[]>(() => getGuidelines());
    const [dosDonts, setDosDontsList] = useState<DosDontsItem[]>(() => getDosDonts());
    const [helplines, setHelplinesList] = useState<HelplineItem[]>(() => getHelplines());
    const [activeHazard, setActiveHazard] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Admin alert notifications — same API as AdminDashboard (/alerts)
    const [alerts, setAlerts] = useState<AlertMessage[]>([]);
    const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => getReadAlertIds());
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const notifPanelRef = useRef<HTMLDivElement>(null);

    const activeAlerts = useMemo(
        () => alerts.filter((a) => a.active !== false),
        [alerts]
    );

    const unreadAlerts = useMemo(
        () => activeAlerts.filter((a) => !readAlertIds.has(alertKey(a))),
        [activeAlerts, readAlertIds]
    );
    const unreadCount = unreadAlerts.length;

    const loadAlerts = async () => {
        try {
            const response = await api.get("/alerts");
            const data = (response.data as AlertMessage[]) || [];
            setAlerts(Array.isArray(data) ? data : []);
            setReadAlertIds(getReadAlertIds());
        } catch (err) {
            console.error("Unable to load alerts", err);
        }
    };

    const openNotifPanel = () => {
        const willOpen = !showNotifPanel;
        setShowNotifPanel(willOpen);
        if (willOpen && activeAlerts.length > 0) {
            const ids = activeAlerts.map((a) => alertKey(a));
            markAlertsRead(ids);
            setReadAlertIds(getReadAlertIds());
        }
    };

    const loadDisasters = async () => {
        try {
            const response = await api.get("/disasters");
            const data = ((response.data as Disaster[]) || []).map((d) => ({
                ...d,
                // Ensure /uploads/... paths resolve to the backend host
                imageUrl: d.imageUrl ? absoluteMediaUrl(d.imageUrl) : d.imageUrl,
            }));
            // merge admin image overrides so user always sees latest image
            setDisasters(mergeImageOverrides(data));
        } catch (err) {
            console.error("Unable to load disasters", err);
        } finally {
            setLoading(false);
        }
    };

    const loadClimate = async (loc: (typeof CLIMATE_LOCATIONS)[number]) => {
        setClimateLoading(true);
        setClimate({
            location: loc.name,
            temperature: 0,
            humidity: 0,
            windSpeed: 0,
            rainfall: 0,
            condition: "Loading…",
        });
        try {
            // Real-time Open-Meteo (no API key)
            const url =
                `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}` +
                `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
                `&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("open-meteo failed");
            const json = await res.json();
            const c = json.current || {};
            const code = Number(c.weather_code) || 0;
            const codeMap: Record<number, string> = {
                0: "Clear",
                1: "Mainly Clear",
                2: "Partly Cloudy",
                3: "Overcast",
                45: "Fog",
                48: "Fog",
                51: "Light Drizzle",
                61: "Rain",
                63: "Rain",
                65: "Heavy Rain",
                71: "Snow",
                80: "Rain Showers",
                95: "Thunderstorm",
            };
            setClimate({
                location: loc.name,
                temperature: Math.round(Number(c.temperature_2m) * 10) / 10,
                humidity: Math.round(Number(c.relative_humidity_2m) || 0),
                windSpeed: Math.round(Number(c.wind_speed_10m) || 0),
                rainfall: Math.round((Number(c.precipitation) || 0) * 10) / 10,
                condition: codeMap[code] || `Code ${code}`,
            });
        } catch (err) {
            console.error(err);
            // fallback: try backend
            try {
                const response = await api.get(
                    `/climate?latitude=${loc.lat}&longitude=${loc.lng}`
                );
                const data = response.data as Climate;
                setClimate({
                    location: loc.name,
                    temperature: Number(data.temperature) || 0,
                    humidity: Number(data.humidity) || 0,
                    windSpeed: Number(data.windSpeed) || 0,
                    rainfall: Number(data.rainfall) || 0,
                    condition: data.condition || "—",
                });
            } catch {
                const seed = Math.abs(Math.round(loc.lat * 100 + loc.lng * 10));
                setClimate({
                    location: loc.name,
                    temperature: 22 + (seed % 12),
                    humidity: 40 + (seed % 45),
                    windSpeed: 5 + (seed % 25),
                    rainfall: seed % 30,
                    condition: "Estimated",
                });
            }
        } finally {
            setClimateLoading(false);
        }
    };



    const loadLiveNews = async () => {
        const items: string[] = [];
        try {
            // ReliefWeb disaster reports (real public API)
            const res = await fetch(
                "https://api.reliefweb.int/v1/reports?appname=disastra&limit=8&profile=full&sort[]=date:desc"
            );
            if (res.ok) {
                const json = await res.json();
                for (const row of json.data || []) {
                    const fields = row.fields || {};
                    const title = fields.title || row.title;
                    const country =
                        (fields.country && fields.country[0] && fields.country[0].name) ||
                        "Global";
                    if (title) items.push(`NEWS · ${country}: ${title}`);
                }
            }
        } catch (e) {
            console.error(e);
        }
        if (items.length === 0) {
            items.push(
                "NEWS · Monitoring global disaster feeds…",
                "NEWS · Stay prepared — check local emergency channels"
            );
        }
        setLiveNews(items);
    };

    const refreshChat = () => {
        const email = user.email || "user@disastra.local";
        setChatSession(chatStore.getForUser(email));
    };

    useEffect(() => {
        loadDisasters();
        loadClimate(CLIMATE_LOCATIONS[0]);
        loadLiveNews();
        refreshChat();
        loadAlerts();
        const unsub = subscribeChat(refreshChat);
        const unsubImg = subscribeImages(() => loadDisasters());
        const refreshContent = () => {
            setVideos(getVideos());
            setWhatsNew(getWhatsNew());
            setGuidelinesList(getGuidelines());
            setDosDontsList(getDosDonts());
            setHelplinesList(getHelplines());
        };
        const unsubContent = subscribeContent(refreshContent);
        const timer = setInterval(() => {
            loadDisasters();
            refreshChat();
            loadAlerts();
        }, 5000);
        const newsTimer = setInterval(loadLiveNews, 120000);
        return () => {
            clearInterval(timer);
            clearInterval(newsTimer);
            unsub();
            unsubImg();
            unsubContent();
        };
    }, []);

    // Close notification panel on outside click
    useEffect(() => {
        if (!showNotifPanel) return;
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (notifPanelRef.current && !notifPanelRef.current.contains(t)) {
                setShowNotifPanel(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [showNotifPanel]);

    useEffect(() => {
        loadClimate(climateLoc);
    }, [climateLoc.name]);

    useEffect(() => {
        // scroll only the chat box, never the whole page
        const el = chatEndRef.current;
        if (!el) return;
        const box = el.parentElement;
        if (box) box.scrollTop = box.scrollHeight;
    }, [chatSession?.messages?.length]);

    const getDisasterImage = (disaster: Disaster) => {
        // Always prefer imageUrl (after mergeImageOverrides)
        return resolveDisasterImage(
            disaster,
            disaster.updatedAt || disaster.id || Date.now()
        );
    };

    const activeDisasters = disasters.filter(
        (d) => d.status?.toUpperCase() === "ACTIVE"
    );

    const newsItems = useMemo(() => {
        const fromData = activeDisasters.map(
            (d) =>
                `LOCAL · ${d.severity} · ${d.type}: ${d.title} — ${d.location}`
        );
        const extras = [
            "Stay alert: Monitor official evacuation channels",
            "AI Assistance can brief you on climate and incident locations",
            "Report new incidents from the Report section for admin review",
        ];
        return [...liveNews, ...fromData, ...extras];
    }, [activeDisasters, liveNews]);

    const handleReportChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setReport((prev) => ({ ...prev, [name]: value }));
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setReportMsg(null);
        try {
            await api.post("/disasters", {
                title: report.title.trim(),
                type: report.type,
                description: report.description.trim(),
                severity: report.severity,
                location: report.location.trim(),
                latitude: report.latitude ? Number(report.latitude) : null,
                longitude: report.longitude ? Number(report.longitude) : null,
                status: "PENDING",
                imageUrl: normalizeImageUrl(report.imageUrl) || report.imageUrl.trim() || "",
            });
            setReportMsg({
                type: "success",
                text: "Report submitted as PENDING. Admin must Approve & post before it is public.",
            });
            setReport(emptyReport);
            loadDisasters();
        } catch (err: any) {
            setReportMsg({
                type: "error",
                text:
                    err?.response?.data?.message ||
                    "Failed to submit report. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const requestAdminChat = () => {
        const session = chatStore.requestChat(
            user.name || "User",
            user.email || "user@disastra.local"
        );
        setChatSession(session);
    };

    const sendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatSession || !chatText.trim()) return;
        if (chatSession.status !== "accepted") return;
        const updated = chatStore.send(
            chatSession.id,
            "user",
            chatText.trim()
        );
        setChatText("");
        if (updated) setChatSession({ ...updated });
    };

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Funds / Razorpay donation form
    const [fundForm, setFundForm] = useState({
        name: "",
        email: "",
        mobile: "",
        amount: "100",
    });
    const [fundMsg, setFundMsg] = useState("");
    const [fundLoading, setFundLoading] = useState(false);
    const [myFunds, setMyFunds] = useState<any[]>([]);
    const [paymentSuccess, setPaymentSuccess] = useState<{
        amount: number;
        paymentId: string;
        email: string;
        name: string;
    } | null>(null);


    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem("disastra_user") || "{}");
            setFundForm((f) => ({
                ...f,
                name: f.name || u.name || "",
                email: f.email || u.email || "",
                mobile: f.mobile || u.mobile || "",
            }));
            if (u.email) {
                api.get("/funds/my/" + encodeURIComponent(u.email))
                    .then((res) => setMyFunds(Array.isArray(res.data) ? res.data : []))
                    .catch(() => {});
            }
        } catch { /* */ }
    }, []);


    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const navCategories = useMemo(() => [
        {
            category: "Emergency & Live",
            items: [
                { id: "home", label: "Home Overview", icon: "home" },
                {
                    id: "disasters",
                    label: "Live Incidents",
                    icon: "disasters",
                    badge: activeDisasters.length > 0 ? activeDisasters.length : undefined,
                    badgeType: "count" as const,
                },
                {
                    id: "map",
                    label: "Live Incident Map",
                    icon: "map",
                    badge: "LIVE",
                    badgeType: "live" as const,
                },
                { id: "analytics", label: "Severity Graph", icon: "analytics" },
                {
                    id: "helplines",
                    label: "Emergency Helplines",
                    icon: "helplines",
                    badge: "24x7",
                    badgeType: "alert" as const,
                },
            ],
        },
        {
            category: "Safety & Guidelines",
            items: [
                {
                    id: "whats-new",
                    label: "What's New",
                    icon: "whats-new",
                    badge: whatsNew.length > 0 ? whatsNew.length : undefined,
                    badgeType: "count" as const,
                },
                { id: "videos", label: "Preparedness Videos", icon: "videos" },
                { id: "resources", label: "NDMA Resources", icon: "resources" },
                { id: "dm-topics", label: "Disaster Mgmt", icon: "dm-topics" },
                { id: "dos-donts", label: "Do's & Don'ts", icon: "dos-donts" },
                { id: "guidelines", label: "Guidelines", icon: "guidelines" },
            ],
        },
        {
            category: "Citizen Services",
            items: [
                { id: "climate", label: "Climate & Weather", icon: "climate" },
                {
                    id: "funds",
                    label: "Donate Funds",
                    icon: "resources",
                    badge: "Pay",
                    badgeType: "action" as const,
                },
                {
                    id: "report",
                    label: "Report Incident",
                    icon: "report",
                    badge: "Submit",
                    badgeType: "action" as const,
                },
                { id: "websites", label: "Important Sites", icon: "websites" },
                { id: "social", label: "Official Feeds", icon: "social" },
            ],
        },
        {
            category: "Support & AI",
            items: [
                {
                    id: "ai",
                    label: "AI Assistance",
                    icon: "ai",
                    badge: "AI 24/7",
                    badgeType: "ai" as const,
                },
                {
                    id: "support",
                    label: "Admin Chat",
                    icon: "support",
                    badge: chatSession?.status === "accepted" ? "Active" : chatSession?.status === "pending" ? "Waiting" : undefined,
                    badgeType: chatSession?.status === "accepted" ? ("live" as const) : ("alert" as const),
                },
            ],
        },
    ], [activeDisasters.length, whatsNew.length, chatSession?.status]);

    const filteredCategories = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return navCategories;
        return navCategories
            .map((cat) => ({
                ...cat,
                items: cat.items.filter(
                    (it) =>
                        it.label.toLowerCase().includes(q) ||
                        it.id.toLowerCase().includes(q) ||
                        cat.category.toLowerCase().includes(q)
                ),
            }))
            .filter((cat) => cat.items.length > 0);
    }, [navCategories, searchQuery]);

    // ScrollSpy: observe sections to auto-highlight active nav link
    useEffect(() => {
        const allItemIds = [
            "home", "disasters", "analytics", "map", "whats-new", "videos",
            "resources", "dm-topics", "dos-donts", "guidelines", "helplines",
            "social", "websites", "climate", "report", "support", "ai"
        ];

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) {
                    visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                    setActiveNav(visible[0].target.id);
                }
            },
            {
                root: null,
                rootMargin: "-15% 0px -65% 0px",
                threshold: [0, 0.2, 0.5],
            }
        );

        allItemIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.key === "/" || (e.ctrlKey && e.key.toLowerCase() === "k")) &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA"
            ) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === "Escape") {
                if (showNotifPanel) setShowNotifPanel(false);
                if (showLogoutModal) setShowLogoutModal(false);
                if (showEmergencyModal) setShowEmergencyModal(false);
                if (searchQuery) setSearchQuery("");
                if (mobileSidebarOpen) setMobileSidebarOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showLogoutModal, showEmergencyModal, searchQuery, mobileSidebarOpen, showNotifPanel]);

    const scrollTo = (id: string) => {
        setActiveNav(id);
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    return (
        <div className="user-dashboard">
            {/* NEWS TICKER */}
            <div className="news-ticker">
                <button
                    type="button"
                    className="mobile-nav-toggle"
                    onClick={() => setMobileSidebarOpen((prev) => !prev)}
                    aria-label="Toggle navigation drawer"
                    title="Menu"
                >
                    <UserIcon name="menu" size={18} />
                </button>
                <div className="news-label">LIVE</div>
                <div className="news-track-wrap">
                    <div className="news-track">
                        {[...newsItems, ...newsItems].map((item, i) => (
                            <span key={i} className="news-item">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile backdrop overlay */}
            {mobileSidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            <div className="user-shell">
                <aside
                    className={`user-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${
                        mobileSidebarOpen ? "mobile-open" : ""
                    }`}
                >
                    {/* 1. FIXED TOP HEADER */}
                    <div className="user-sidebar-header">
                        <div className="user-brand" onClick={() => scrollTo("home")}>
                            <div className="brand-logo-wrap">
                                <div className="brand-logo">
                                    <UserIcon name="shield-check" size={20} />
                                </div>
                                <span className="live-network-dot" title="NDMA National Live Sync" />
                            </div>
                            {!sidebarCollapsed && (
                                <div className="brand-text">
                                    <div className="brand-title-row">
                                        <h2>DISASTRA</h2>
                                        <span className="brand-badge">CITIZEN</span>
                                    </div>
                                    <span className="brand-sub">NATIONAL DISASTER PORTAL</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="sidebar-collapse-btn"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            aria-label="Toggle sidebar width"
                        >
                            <UserIcon
                                name={sidebarCollapsed ? "chevron-right" : "chevron-left"}
                                size={15}
                            />
                        </button>
                    </div>

                    {/* QUICK EMERGENCY SOS TRIGGER */}
                    {!sidebarCollapsed && (
                        <button
                            type="button"
                            className="sidebar-sos-beacon"
                            onClick={() => setShowEmergencyModal(true)}
                            title="Open Emergency 112 & National Helplines"
                        >
                            <span className="sos-pulse-ring" />
                            <span className="sos-icon">
                                <UserIcon name="sos" size={16} />
                            </span>
                            <div className="sos-text">
                                <strong>EMERGENCY SOS</strong>
                                <span>Dial 112 · Helplines</span>
                            </div>
                            <span className="sos-arrow">→</span>
                        </button>
                    )}

                    {/* Sidebar notification shortcut (mirrors admin bell) */}
                    {!sidebarCollapsed && (
                        <button
                            type="button"
                            className="sidebar-notif-btn"
                            onClick={openNotifPanel}
                            title="Admin alert messages"
                            style={{
                                margin: "0 12px 8px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                width: "calc(100% - 24px)",
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid rgba(52,211,153,0.25)",
                                background: unreadCount
                                    ? "rgba(239,68,68,0.12)"
                                    : "rgba(15,23,42,0.4)",
                                color: "#e2e8f0",
                                cursor: "pointer",
                                fontSize: 13,
                            }}
                        >
                            <span style={{ position: "relative", display: "inline-flex" }}>
                                <NotifBellIcon size={16} />
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: -6,
                                            right: -8,
                                            minWidth: 16,
                                            height: 16,
                                            borderRadius: 999,
                                            background: "#ef4444",
                                            color: "#fff",
                                            fontSize: 9,
                                            fontWeight: 800,
                                            lineHeight: "16px",
                                            textAlign: "center",
                                            padding: "0 3px",
                                        }}
                                    >
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </span>
                            <span style={{ flex: 1, textAlign: "left", fontWeight: 600 }}>
                                Notifications
                            </span>
                            {unreadCount > 0 ? (
                                <span style={{ color: "#fca5a5", fontSize: 11, fontWeight: 700 }}>
                                    {unreadCount} new
                                </span>
                            ) : (
                                <span style={{ color: "#64748b", fontSize: 11 }}>All clear</span>
                            )}
                        </button>
                    )}

                    {/* SEARCH / FILTER INPUT */}
                    {!sidebarCollapsed && (
                        <div className="sidebar-search-box">
                            <UserIcon name="search" size={14} className="search-icon" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search portal... (/)"
                                className="sidebar-search-input"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="search-clear-btn"
                                    onClick={() => setSearchQuery("")}
                                    title="Clear search"
                                >
                                    <UserIcon name="close" size={12} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* 2. SCROLLABLE NAVIGATION CONTAINER (NEVER CLIPS LOGOUT!) */}
                    <div className="user-nav-scroll">
                        {filteredCategories.length === 0 ? (
                            <div className="nav-empty-state">
                                <UserIcon name="search" size={24} />
                                <p>No matches for &ldquo;{searchQuery}&rdquo;</p>
                                <button
                                    type="button"
                                    className="nav-empty-clear"
                                    onClick={() => setSearchQuery("")}
                                >
                                    Reset filter
                                </button>
                            </div>
                        ) : (
                            filteredCategories.map((group) => (
                                <div key={group.category} className="nav-group">
                                    {!sidebarCollapsed && (
                                        <div className="nav-group-title">
                                            <span>{group.category}</span>
                                            <span className="nav-group-line" />
                                        </div>
                                    )}
                                    <div className="nav-group-items">
                                        {group.items.map((item) => {
                                            const isActive = activeNav === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className={`user-nav-btn ${isActive ? "active" : ""}`}
                                                    onClick={() => scrollTo(item.id)}
                                                    title={sidebarCollapsed ? item.label : undefined}
                                                >
                                                    <span className="nav-icon-wrap">
                                                        <UserIcon name={item.icon} size={18} />
                                                    </span>
                                                    {!sidebarCollapsed && (
                                                        <span className="nav-label">{item.label}</span>
                                                    )}
                                                    {!sidebarCollapsed && item.badge !== undefined && (
                                                        <span className={`nav-badge badge-${item.badgeType || "default"}`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {isActive && <span className="active-indicator-glow" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 3. PINNED BOTTOM FOOTER (ALWAYS VISIBLE & ACCESSIBLE) */}
                    <div className="user-sidebar-footer">
                        {!sidebarCollapsed ? (
                            <div className="user-profile-card">
                                <div className="user-avatar-wrap">
                                    <div className="user-avatar">
                                        {(user.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="user-online-badge" />
                                </div>
                                <div className="user-info">
                                    <strong className="user-name">{user.name || "Citizen"}</strong>
                                    <span className="user-role-tag">
                                        <UserIcon name="shield-check" size={11} /> Verified Citizen
                                    </span>
                                </div>
                                <ThemeToggle className="footer-theme-btn" />
                            </div>
                        ) : (
                            <div className="collapsed-footer-actions">
                                <div className="user-avatar collapsed" title={user.name || "Citizen"}>
                                    {(user.name || "U").charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            className="user-logout-btn"
                            onClick={() => setShowLogoutModal(true)}
                            title="Sign out of Citizen Portal"
                        >
                            <UserIcon name="logout" size={17} />
                            {!sidebarCollapsed && <span>Sign Out</span>}
                        </button>
                    </div>
                </aside>

                <main className="user-main">
                    <header className="user-header ndma-hero" id="home">
                        <div className="ndma-hero-text">
                            <span className="system-status">DISASTRA · NATIONAL DISASTER PORTAL</span>
                            <h1>Stronger Together, Safer Forever</h1>
                            <p>
                                Disastra is the citizen portal for disaster awareness,
                                live incident tracking, climate intel, preparedness
                                videos, AI assistance, and direct admin support —
                                inspired by India’s National Disaster Management Authority.
                            </p>
                            <div className="ndma-hero-actions">
                                <button type="button" className="ndma-btn primary" onClick={() => scrollTo("videos")}>
                                    Watch preparedness videos
                                </button>
                                <button type="button" className="ndma-btn ghost" onClick={() => scrollTo("map")}>
                                    View live map
                                </button>
                            </div>
                        </div>
                        <div className="user-stats-row">
                            <div className="user-stat-chip chip-red">
                                <strong>
                                    {
                                        disasters.filter((d) =>
                                            (d.severity || "")
                                                .toUpperCase()
                                                .includes("CRIT")
                                        ).length
                                    }
                                </strong>
                                <span>Critical</span>
                            </div>
                            <div className="user-stat-chip chip-cyan">
                                <strong>{activeDisasters.length}</strong>
                                <span>Active</span>
                            </div>
                            <div className="user-stat-chip chip-blue">
                                <strong>{disasters.length}</strong>
                                <span>Total</span>
                            </div>
                            {/* Notification bell — same as admin for alert messages */}
                            <div className="user-notif-wrap" style={{ position: "relative" }}>
                                <button
                                    type="button"
                                    className="user-notif-btn"
                                    onClick={openNotifPanel}
                                    title="Admin alerts & notifications"
                                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                                    aria-expanded={showNotifPanel}
                                    style={{
                                        position: "relative",
                                        width: 40,
                                        height: 40,
                                        borderRadius: 12,
                                        border: "1px solid rgba(52,211,153,0.35)",
                                        background: showNotifPanel
                                            ? "rgba(16,185,129,0.25)"
                                            : "rgba(15,23,42,0.55)",
                                        color: "#ecfdf5",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <NotifBellIcon size={18} />
                                    {unreadCount > 0 && (
                                        <span
                                            className="user-notif-badge"
                                            style={{
                                                position: "absolute",
                                                top: -4,
                                                right: -4,
                                                minWidth: 18,
                                                height: 18,
                                                padding: "0 5px",
                                                borderRadius: 999,
                                                background: "#ef4444",
                                                color: "#fff",
                                                fontSize: 10,
                                                fontWeight: 800,
                                                lineHeight: "18px",
                                                textAlign: "center",
                                                boxShadow: "0 0 0 2px #0f172a",
                                            }}
                                        >
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <ThemeToggle />
                            <div className="user-profile">{user.name || "User"}</div>
                        </div>
                    </header>

                    {loading ? (
                        <div className="loading-box">Syncing disaster feeds…</div>
                    ) : (
                        <>
                            <section className="user-section" id="disasters">
                                <div className="section-title">
                                    <div>
                                        <h2>Active incidents</h2>
                                        <p>View only — admins edit records and media.</p>
                                    </div>
                                    <span className="live-badge">LIVE</span>
                                </div>

                                {activeDisasters.length === 0 ? (
                                    <div className="empty-state">
                                        <h3>All clear</h3>
                                        <p>No active disasters at the moment.</p>
                                    </div>
                                ) : (
                                    <div className="user-disaster-grid">
                                        {activeDisasters.map((disaster) => (
                                            <article
                                                className="user-disaster-card is-clickable"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => { setSelectedDisaster(disaster); setGalleryIndex(0); }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    setSelectedDisaster(disaster);
    setGalleryIndex(0);
}
                                            }}
                                                key={disaster.id}
                                            >
                                                <div className="user-disaster-image-wrap">
                                                    <img
    src={getDisasterImage(disaster)}
    alt={`${disaster.type || "Disaster"}: ${disaster.title || "Report"}`}
    className="user-disaster-image"
    loading="lazy"
    onError={(e) => {
        const img = e.currentTarget;

        if (img.dataset.fallback === "true") {
            img.style.visibility = "hidden";
            return;
        }

        img.dataset.fallback = "true";
        img.src =
            "https://images.unsplash.com/photo-1561485132-59468cd0b553?auto=format&fit=crop&w=900&q=80";
    }}
/>
                                                    <span
                                                        className={`severity-badge ${disaster.severity?.toLowerCase()}`}
                                                    >
                                                        {disaster.severity}
                                                    </span>
                                                </div>
                                                <div className="user-disaster-content">
                                                    <div className="disaster-top">
                                                        <span className="disaster-type-tag">
                                                            {disaster.type}
                                                        </span>
                                                        <span className="active-status">
                                                            ACTIVE
                                                        </span>
                                                    </div>
                                                    <h3>{disaster.title}</h3>
                                                    <p className="disaster-description">
                                                        {disaster.description}
                                                    </p>
                                                    <div className="disaster-location">
                                                        {disaster.location}
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="user-section" id="analytics">
                                <div className="section-title">
                                    <div>
                                        <h2>Severity analytics</h2>
                                        <p>
                                            Graph of disasters by level — Critical,
                                            High, Medium, Low.
                                        </p>
                                    </div>
                                </div>
                                <SeverityChart disasters={disasters} />
                            </section>

                            <section className="user-section" id="map">
                                <div className="section-title">
                                    <div>
                                        <h2>Live incident map</h2>
                                        <p>Blinking pins colored by severity.</p>
                                    </div>
                                    <span className="live-badge">LIVE</span>
                                </div>
                                <div className="map-legend">
                                    <span className="legend-item critical">Critical</span>
                                    <span className="legend-item high">High</span>
                                    <span className="legend-item medium">Medium</span>
                                    <span className="legend-item low">Low</span>
                                </div>
                                <div className="user-map-wrap">
                                    <DisasterMap disasters={activeDisasters} />
                                </div>
                            </section>

                            <section className="user-section" id="whats-new">
                                <div className="section-title">
                                    <div>
                                        <h2>What&apos;s New</h2>
                                        <p>Latest announcements, guidelines releases and mock-exercise updates from Disastra command.</p>
                                    </div>
                                </div>
                                <div className="whats-new-list">
                                    {whatsNew.length === 0 && (
                                        <p className="empty-hint">No announcements yet.</p>
                                    )}
                                    {whatsNew.map((item) => (
                                        <article key={item.id} className="whats-new-card">
                                            <time>{item.date}</time>
                                            <h3>{item.title}</h3>
                                            <p>{item.summary}</p>
                                            {item.link && (
                                                <a href={item.link} target="_blank" rel="noreferrer">
                                                    View / Download
                                                </a>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="user-section" id="videos">
                                <div className="section-title">
                                    <div>
                                        <h2>Awareness &amp; preparedness videos</h2>
                                        <p>
                                            Videos published by Disastra admin for citizen awareness.
                                            Same library as the NDMA-style public portal.
                                        </p>
                                    </div>
                                </div>
                                <div className="videos-grid">
                                    {videos.length === 0 && (
                                        <p className="empty-hint">No videos published yet. Check back soon.</p>
                                    )}
                                    {videos.map((v) => (
                                        <article key={v.id} className="video-card">
                                            <div className="video-embed">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${v.youtubeId}`}
                                                    title={v.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="video-meta">
                                                <h3>{v.title}</h3>
                                                <p>{v.description}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="user-section" id="dos-donts">
                                <div className="section-title">
                                    <div>
                                        <h2>Do&apos;s &amp; Don&apos;ts</h2>
                                        <p>Hazard-wise safety guidance inspired by NDMA public advisories.</p>
                                    </div>
                                </div>
                                <div className="hazard-tabs">
                                    {dosDonts.map((h, i) => (
                                        <button
                                            key={h.id}
                                            type="button"
                                            className={activeHazard === i ? "active" : ""}
                                            onClick={() => setActiveHazard(i)}
                                        >
                                            {h.hazard}
                                        </button>
                                    ))}
                                </div>
                                {dosDonts[activeHazard] && (
                                    <div className="dos-donts-grid">
                                        <div className="dos-card">
                                            <h3>✓ Do&apos;s — {dosDonts[activeHazard].hazard}</h3>
                                            <ul>
                                                {dosDonts[activeHazard].dos.map((d, i) => (
                                                    <li key={i}>{d}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="donts-card">
                                            <h3>✕ Don&apos;ts — {dosDonts[activeHazard].hazard}</h3>
                                            <ul>
                                                {dosDonts[activeHazard].donts.map((d, i) => (
                                                    <li key={i}>{d}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="user-section" id="guidelines">
                                <div className="section-title">
                                    <div>
                                        <h2>NDMA-style Guidelines</h2>
                                        <p>Key national guidelines and policy documents curated for Disastra users.</p>
                                    </div>
                                </div>
                                <div className="guidelines-table-wrap">
                                    <table className="guidelines-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Release</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {guidelines.map((g, i) => (
                                                <tr key={g.id}>
                                                    <td>{i + 1}</td>
                                                    <td>{g.title}</td>
                                                    <td>{g.category}</td>
                                                    <td>{g.releaseDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="user-section" id="helplines">
                                <div className="section-title">
                                    <div>
                                        <h2>Emergency Helplines</h2>
                                        <p>National and disaster-related contact numbers.</p>
                                    </div>
                                </div>
                                <div className="helplines-grid">
                                    {helplines.map((h) => (
                                        <div key={h.id} className="helpline-card">
                                            <strong>{h.name}</strong>
                                            <a href={`tel:${h.number.replace(/\s/g, "")}`}>{h.number}</a>
                                            {h.note && <span>{h.note}</span>}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ===== RESOURCES (NDMA-style cards) ===== */}
                            <section className="user-section" id="resources">
                                <div className="section-title">
                                    <div>
                                        <h2>Resources</h2>
                                        <p>National plans, policies, guidelines, reports and atlases — NDMA-style resource library.</p>
                                    </div>
                                </div>
                                <div className="ndma-resource-grid">
                                    {[
                                        { title: "National Plan", sub: "National Disaster Management Plan", color: "#166534", emoji: "📗" },
                                        { title: "National Policy", sub: "National Policy on Disaster Management 2009", color: "#14532d", emoji: "📘" },
                                        { title: "National Guideline", sub: "HADR · EOC · CBDRR guidelines", color: "#1e3a5f", emoji: "📑" },
                                        { title: "Reports Studies", sub: "Mission reports · Forest fire · studies", color: "#7c2d12", emoji: "📊" },
                                        { title: "Sign Language Videos", sub: "Accessibility awareness videos", color: "#4c1d95", emoji: "🤟" },
                                        { title: "Annual Report", sub: "Annual Report 2022-23", color: "#854d0e", emoji: "📒" },
                                        { title: "Hazard Atlas", sub: "Satellite-based hazard mapping", color: "#9a3412", emoji: "🗺️" },
                                    ].map((r) => (
                                        <article key={r.title} className="ndma-resource-card">
                                            <div className="ndma-resource-cover" style={{ background: `linear-gradient(160deg, ${r.color}, #0f172a)` }}>
                                                <span className="ndma-resource-emoji">{r.emoji}</span>
                                                <span className="ndma-resource-cover-title">{r.title}</span>
                                            </div>
                                            <div className="ndma-resource-body">
                                                <h3>{r.title}</h3>
                                                <p>{r.sub}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            {/* ===== DISASTER MANAGEMENT TOPICS ===== */}
                            <section className="user-section" id="dm-topics">
                                <div className="section-title">
                                    <div>
                                        <h2>Disaster Management</h2>
                                        <p>Natural &amp; man-made hazards, State DMAs, and global frameworks.</p>
                                    </div>
                                </div>
                                <div className="ndma-dm-grid">
                                    <article className="ndma-dm-card">
                                        <div className="ndma-dm-photo" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1504198266287-1659872e6590?w=600&q=80)" }} />
                                        <h3>Natural Hazards</h3>
                                        <ul>
                                            {["Cyclone", "Tsunami", "Heat Wave", "Landslide", "Earthquake", "Flood", "Drought", "Avalanche"].map((x) => (
                                                <li key={x}>&gt; {x}</li>
                                            ))}
                                        </ul>
                                    </article>
                                    <article className="ndma-dm-card">
                                        <div className="ndma-dm-photo" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1581094794329-cdcbf6e9cbeb?w=600&q=80)" }} />
                                        <h3>Man Made Hazards</h3>
                                        <ul>
                                            {["Chemical", "Nuclear", "Biological", "Radiological", "Industrial", "Fire", "Transport"].map((x) => (
                                                <li key={x}>&gt; {x}</li>
                                            ))}
                                        </ul>
                                    </article>
                                    <article className="ndma-dm-card">
                                        <div className="ndma-dm-photo" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1547683905-f86c17ce1c1a?w=600&q=80)" }} />
                                        <h3>SDMA</h3>
                                        <ul>
                                            {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Odisha", "Tamil Nadu", "Uttar Pradesh", "West Bengal"].map((x) => (
                                                <li key={x}>&gt; {x}</li>
                                            ))}
                                        </ul>
                                    </article>
                                    <article className="ndma-dm-card">
                                        <div className="ndma-dm-photo ndma-dm-sdg">
                                            <span>SDG · Sendai · CDRI</span>
                                        </div>
                                        <h3>Global Initiatives</h3>
                                        <ul>
                                            {["CDRI", "SDG", "Sendai Framework", "Paris Agreement", "UNDRR"].map((x) => (
                                                <li key={x}>&gt; {x}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </div>
                            </section>

                            {/* ===== SOCIAL MEDIA ===== */}
                            <section className="user-section" id="social">
                                <div className="section-title">
                                    <div>
                                        <h2>Social Media</h2>
                                        <p>Follow Disastra / NDMA-style official channels for alerts and awareness.</p>
                                    </div>
                                </div>
                                <div className="ndma-social-grid">
                                    {[
                                        { name: "X", handle: "@ndmaindia", url: "https://x.com/ndmaindia", color: "#000", label: "X (Twitter)" },
                                        { name: "Facebook", handle: "NDMA India", url: "https://www.facebook.com/NDMA.in", color: "#1877f2", label: "Facebook" },
                                        { name: "YouTube", handle: "NDMA India", url: "https://www.youtube.com/@ndmaindia", color: "#ff0000", label: "YouTube" },
                                        { name: "LinkedIn", handle: "NDMA India", url: "https://www.linkedin.com/company/national-disaster-management-authority-ndma-india", color: "#0a66c2", label: "LinkedIn" },
                                    ].map((s) => (
                                        <a
                                            key={s.name}
                                            className="ndma-social-card"
                                            href={s.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <div className="ndma-social-badge" style={{ background: s.color }}>
                                                {s.name === "X" ? "𝕏" : s.name[0]}
                                            </div>
                                            <div>
                                                <strong>{s.label}</strong>
                                                <span>{s.handle}</span>
                                            </div>
                                            <span className="ndma-social-cta">Open →</span>
                                        </a>
                                    ))}
                                </div>
                            </section>

                            {/* ===== IMPORTANT WEBSITES ===== */}
                            <section className="user-section" id="websites">
                                <div className="section-title">
                                    <div>
                                        <h2>Important Websites</h2>
                                        <p>Partner agencies and national portals linked from the NDMA ecosystem.</p>
                                    </div>
                                </div>
                                <div className="ndma-sites-grid">
                                    {[
                                        { name: "INCOIS", url: "https://incois.gov.in", desc: "Indian National Centre for Ocean Information Services" },
                                        { name: "CWC", url: "https://cwc.gov.in", desc: "Central Water Commission" },
                                        { name: "IMD", url: "https://mausam.imd.gov.in", desc: "India Meteorological Department" },
                                        { name: "LBSNAA", url: "https://www.lbsnaa.gov.in", desc: "Lal Bahadur Shastri National Academy of Administration" },
                                        { name: "india.gov.in", url: "https://www.india.gov.in", desc: "National Portal of India" },
                                        { name: "DGRE", url: "https://www.drdo.gov.in", desc: "Defence Geo-informatics Research Establishment" },
                                        { name: "FSI", url: "https://fsi.nic.in", desc: "Forest Survey of India" },
                                        { name: "NIDM", url: "https://nidm.gov.in", desc: "National Institute of Disaster Management" },
                                        { name: "SACHET", url: "https://sachet.ndma.gov.in", desc: "National Disaster Alert Portal" },
                                        { name: "NDRF", url: "https://ndrf.gov.in", desc: "National Disaster Response Force" },
                                    ].map((w) => (
                                        <a
                                            key={w.name}
                                            className="ndma-site-card"
                                            href={w.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <strong>{w.name}</strong>
                                            <span>{w.desc}</span>
                                        </a>
                                    ))}
                                </div>
                                <div className="ndma-footer-links">
                                    <span>Terms of Use</span>
                                    <span>Website Policy</span>
                                    <span>Tender</span>
                                    <span>Help</span>
                                    <span>RTI</span>
                                    <span>Feedback</span>
                                    <span>Archives</span>
                                    <span>Sitemap</span>
                                </div>
                            </section>

                            <section className="user-section" id="climate">
                                <div className="section-title">
                                    <div>
                                        <h2>Climate by location</h2>
                                        <p>
                                            Choose a city to refresh temperature,
                                            humidity, wind, and rainfall.
                                        </p>
                                    </div>
                                    <select
                                        className="location-select"
                                        value={climateLoc.name}
                                        onChange={(e) => {
                                            const loc = CLIMATE_LOCATIONS.find(
                                                (l) => l.name === e.target.value
                                            );
                                            if (loc) {
                                                setClimateLoc(loc);
                                                loadClimate(loc);
                                            }
                                        }}
                                    >
                                        {CLIMATE_LOCATIONS.map((l) => (
                                            <option key={l.name} value={l.name}>
                                                {l.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {climateLoading && (
                                    <p style={{ color: "#67e8f9", fontSize: 13, marginBottom: 12 }}>Updating climate for {climateLoc.name}…</p>
                                )}
                                {climate && (
                                    <div className="user-climate-grid">
                                        {[
                                            {
                                                label: "Location",
                                                value: climate.location || climateLoc.name,
                                                tone: "white",
                                            },
                                            {
                                                label: "Temperature",
                                                value: `${climate.temperature}°C`,
                                                tone: "red",
                                            },
                                            {
                                                label: "Humidity",
                                                value: `${climate.humidity}%`,
                                                tone: "blue",
                                            },
                                            {
                                                label: "Wind",
                                                value: `${climate.windSpeed} km/h`,
                                                tone: "cyan",
                                            },
                                            {
                                                label: "Rainfall",
                                                value: `${climate.rainfall} mm`,
                                                tone: "blue",
                                            },
                                            {
                                                label: "Condition",
                                                value: climate.condition,
                                                tone: "white",
                                            },
                                        ].map((c) => (
                                            <div
                                                className={`user-climate-card tone-${c.tone}`}
                                                key={c.label}
                                            >
                                                <small>{c.label}</small>
                                                <strong>{c.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="user-section" id="funds">
                                <div className="section-title">
                                    <div>
                                        <h2>Donate Funds</h2>
                                        <p>
                                            Support disaster relief. Pay securely via Razorpay (test mode).
                                            Enter your name, email and mobile — you will receive a confirmation email after successful payment.
                                        </p>
                                    </div>
                                </div>

                                <div className="report-form-card" style={{ maxWidth: 520, marginBottom: 24 }}>
                                    <div className="form-grid" style={{ display: "grid", gap: 12 }}>
                                        <label>
                                            Full name
                                            <input
                                                type="text"
                                                value={fundForm.name}
                                                onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })}
                                                placeholder="Your name"
                                            />
                                        </label>
                                        <label>
                                            Email
                                            <input
                                                type="email"
                                                value={fundForm.email}
                                                onChange={(e) => setFundForm({ ...fundForm, email: e.target.value })}
                                                placeholder="you@example.com"
                                            />
                                        </label>
                                        <label>
                                            Mobile
                                            <input
                                                type="tel"
                                                value={fundForm.mobile}
                                                onChange={(e) => setFundForm({ ...fundForm, mobile: e.target.value })}
                                                placeholder="10-digit mobile"
                                            />
                                        </label>
                                        <label>
                                            Amount (INR)
                                            <input
                                                type="number"
                                                min={1}
                                                value={fundForm.amount}
                                                onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })}
                                            />
                                        </label>
                                    </div>
                                    {fundMsg && (
                                        <p style={{ marginTop: 12, color: fundMsg.startsWith("✓") ? "#16a34a" : "#dc2626" }}>
                                            {fundMsg}
                                        </p>
                                    )}
                                    <button
                                        className="primary-button"
                                        style={{ marginTop: 16 }}
                                        disabled={fundLoading}
                                        onClick={async () => {
                                            setFundMsg("");
                                            const name = fundForm.name.trim();
                                            const email = fundForm.email.trim();
                                            const mobile = fundForm.mobile.trim();
                                            const amount = Number(fundForm.amount);
                                            if (!name || !email || !mobile || !(amount >= 1)) {
                                                setFundMsg("Please fill name, email, mobile and amount (≥ 1).");
                                                return;
                                            }
                                            try {
                                                setFundLoading(true);
                                                // Ensure Razorpay script
                                                if (!(window as any).Razorpay) {
                                                    await new Promise<void>((resolve, reject) => {
                                                        const s = document.createElement("script");
                                                        s.src = "https://checkout.razorpay.com/v1/checkout.js";
                                                        s.onload = () => resolve();
                                                        s.onerror = () => reject(new Error("Failed to load Razorpay"));
                                                        document.body.appendChild(s);
                                                    });
                                                }
                                                let userId: number | undefined;
                                                try {
                                                    const u = JSON.parse(localStorage.getItem("disastra_user") || "{}");
                                                    userId = u.id;
                                                    if (!fundForm.name && u.name) setFundForm((f) => ({ ...f, name: u.name }));
                                                    if (!fundForm.email && u.email) setFundForm((f) => ({ ...f, email: u.email }));
                                                    if (!fundForm.mobile && u.mobile) setFundForm((f) => ({ ...f, mobile: u.mobile }));
                                                } catch { /* */ }

                                                const orderRes = await api.post("/funds/create-order", {
                                                    name, email, mobile, amount, userId,
                                                });
                                                const order = orderRes.data;
                                                if (order.error) {
                                                    setFundMsg(order.error);
                                                    return;
                                                }

                                                const options: any = {
                                                    key: order.key,
                                                    amount: order.amount,
                                                    currency: order.currency || "INR",
                                                    name: "DISASTRA",
                                                    description: "Disaster relief donation",
                                                    order_id: order.orderId,
                                                    prefill: { name, email, contact: mobile },
                                                    handler: async (response: any) => {
                                                        try {
                                                            const ver = await api.post("/funds/verify", {
                                                                razorpay_order_id: response.razorpay_order_id,
                                                                razorpay_payment_id: response.razorpay_payment_id,
                                                                razorpay_signature: response.razorpay_signature,
                                                            });
                                                            if (ver.data?.success) {
                                                                setFundMsg("✓ Payment successful! A confirmation email has been sent to " + email);
                                                                setPaymentSuccess({
                                                                    amount,
                                                                    paymentId: response.razorpay_payment_id || "",
                                                                    email,
                                                                    name,
                                                                });
                                                                try {
                                                                    const mine = await api.get("/funds/my/" + encodeURIComponent(email));
                                                                    setMyFunds(Array.isArray(mine.data) ? mine.data : []);
                                                                } catch { /* */ }
                                                            } else {
                                                                setFundMsg(ver.data?.error || "Verification failed");
                                                            }
                                                        } catch (err: any) {
                                                            setFundMsg(err?.response?.data?.error || "Verification failed");
                                                        }
                                                    },
                                                    theme: { color: "#0f766e" },
                                                };
                                                const rzp = new (window as any).Razorpay(options);
                                                rzp.on("payment.failed", (resp: any) => {
                                                    setFundMsg("Payment failed: " + (resp?.error?.description || "Unknown error"));
                                                });
                                                rzp.open();
                                            } catch (err: any) {
                                                setFundMsg(err?.response?.data?.error || err?.message || "Could not start payment");
                                            } finally {
                                                setFundLoading(false);
                                            }
                                        }}
                                    >
                                        {fundLoading ? "Processing…" : "Pay with Razorpay"}
                                    </button>
                                </div>

                                {myFunds.length > 0 && (
                                    <div>
                                        <h3 style={{ marginBottom: 8 }}>Your recent donations</h3>
                                        <ul style={{ listStyle: "none", padding: 0 }}>
                                            {myFunds.map((f: any) => (
                                                <li key={f.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
                                                    ₹{Number(f.amount).toFixed(2)} — {f.status}
                                                    {f.paidAt ? " · " + new Date(f.paidAt).toLocaleString("en-IN") : ""}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>

                            <section className="user-section" id="report">
                                <div className="section-title">
                                    <div>
                                        <h2>Report an incident</h2>
                                        <p>
                                            Submissions stay PENDING until an admin
                                            activates them.
                                        </p>
                                    </div>
                                </div>
                                <form
                                    className="user-report-form"
                                    onSubmit={handleReportSubmit}
                                >
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="title">Title</label>
                                            <input
                                                id="title"
                                                name="title"
                                                required
                                                value={report.title}
                                                onChange={handleReportChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="type">Type</label>
                                            <select
                                                id="type"
                                                name="type"
                                                value={report.type}
                                                onChange={handleReportChange}
                                            >
                                                <option value="FLOOD">Flood</option>
                                                <option value="CYCLONE">Cyclone</option>
                                                <option value="EARTHQUAKE">
                                                    Earthquake
                                                </option>
                                                <option value="LANDSLIDE">
                                                    Landslide
                                                </option>
                                                <option value="FIRE">Fire</option>
                                                <option value="DROUGHT">Drought</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="severity">Severity</label>
                                            <select
                                                id="severity"
                                                name="severity"
                                                value={report.severity}
                                                onChange={handleReportChange}
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="CRITICAL">Critical</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="location">Location</label>
                                            <input
                                                id="location"
                                                name="location"
                                                required
                                                value={report.location}
                                                onChange={handleReportChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="latitude">Latitude</label>
                                            <input
                                                id="latitude"
                                                name="latitude"
                                                type="number"
                                                step="any"
                                                value={report.latitude}
                                                onChange={handleReportChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="longitude">Longitude</label>
                                            <input
                                                id="longitude"
                                                name="longitude"
                                                type="number"
                                                step="any"
                                                value={report.longitude}
                                                onChange={handleReportChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group full">
                                        <label htmlFor="imageUrl">Disaster image</label>
                                        <input
                                            id="imageUrl"
                                            name="imageUrl"
                                            type="text"
                                            value={report.imageUrl}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setReport((prev) => ({
                                                    ...prev,
                                                    imageUrl: normalizeImageUrl(v) || v,
                                                }));
                                            }}
                                            placeholder="Paste image link or upload file"
                                        />
                                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <label className="report-submit-btn" style={{ display: "inline-flex", cursor: "pointer", margin: 0 }}>
                                                Upload image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: "none" }}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        try {
                                                            const serverUrl = await uploadImageFile(file);
                                                            setReport((prev) => ({ ...prev, imageUrl: serverUrl }));
                                                        } catch (err: any) {
                                                            setReportMsg({ type: "error", text: err?.message || "Upload failed" });
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <div className="image-preview-box" style={{ marginTop: 12, minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {report.imageUrl.trim() ? (
                                                <img
                                                    src={resolveDisasterImage({ imageUrl: report.imageUrl, type: report.type, title: report.title })}
                                                    alt="Preview"
                                                    style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block", borderRadius: 12 }}
                                                    onError={(e) => { e.currentTarget.style.opacity = "0.35"; }}
                                                />
                                            ) : (
                                                <span style={{ color: "#94a3b8", fontSize: 13 }}>Preview appears here before submit</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group full">
                                        <label htmlFor="description">Description</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            required
                                            rows={4}
                                            value={report.description}
                                            onChange={handleReportChange}
                                        />
                                    </div>
                                    {reportMsg && (
                                        <div className={`report-message ${reportMsg.type}`}>
                                            {reportMsg.text}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="report-submit-btn"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Submitting…" : "Submit to admin"}
                                    </button>
                                </form>
                            </section>

                            <section className="user-section" id="support">
                                <div className="section-title">
                                    <div>
                                        <h2>Chat with admin</h2>
                                        <p>
                                            Request a session. Messaging unlocks after
                                            admin accepts in Admin → User Chats.
                                        </p>
                                    </div>
                                </div>
                                <div className="support-chat">
                                    {!chatSession && (
                                        <div className="support-empty">
                                            <p>
                                                Need human support? Request an admin
                                                chat session.
                                            </p>
                                            <button
                                                type="button"
                                                className="report-submit-btn"
                                                onClick={requestAdminChat}
                                            >
                                                Request admin chat
                                            </button>
                                        </div>
                                    )}
                                    {chatSession && (
                                        <>
                                            <div
                                                className={`chat-status-bar ${chatSession.status}`}
                                            >
                                                Status:{" "}
                                                <strong>
                                                    {chatSession.status.toUpperCase()}
                                                </strong>
                                                {chatSession.status === "pending" && (
                                                    <span>
                                                        {" "}
                                                        — waiting for admin approval
                                                    </span>
                                                )}
                                            </div>
                                            <div className="chat-messages">
                                                {chatSession.messages.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        className={`chat-bubble ${m.from}`}
                                                    >
                                                        <span className="chat-who">
                                                            {m.from === "user"
                                                                ? "You"
                                                                : "Admin"}
                                                        </span>
                                                        <p>{m.text}</p>
                                                    </div>
                                                ))}
                                                <div ref={chatEndRef} />
                                            </div>
                                            {chatSession.status === "accepted" ? (
                                                <form
                                                    className="chat-compose"
                                                    onSubmit={sendChat}
                                                >
                                                    <input
                                                        value={chatText}
                                                        onChange={(e) =>
                                                            setChatText(e.target.value)
                                                        }
                                                        placeholder="Message admin…"
                                                    />
                                                    <button type="submit">Send</button>
                                                </form>
                                            ) : chatSession.status === "pending" ? (
                                                <p className="chat-wait">
                                                    Waiting for admin to accept…
                                                </p>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="report-submit-btn"
                                                    onClick={requestAdminChat}
                                                >
                                                    Start new request
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>

                            <section className="user-section" id="ai">
                                <div className="section-title">
                                    <div>
                                        <h2>AI Assistance</h2>
                                        <p>
                                            Ask about locations, climate, severity, and
                                            safety guidance.
                                        </p>
                                    </div>
                                </div>
                                


            <AIAssist context={{ disasters, climate }} />
                            </section>
                        </>
                    )}

                    <footer className="user-footer">DISASTRA · Stronger Together, Safer Forever · User portal</footer>
                </main>
            </div>


            
            {selectedDisaster && (
                <DisasterDetailModal
                    disaster={selectedDisaster}
                    galleryIndex={galleryIndex}
                    setGalleryIndex={setGalleryIndex}
                    onClose={() => {
                        setSelectedDisaster(null);
                        setGalleryIndex(0);
                    }}
                    getImage={getDisasterImage}
                />
            )}

            {/* ADMIN ALERT NOTIFICATIONS PANEL */}
            {showNotifPanel && (
                <div
                    className="disastra-modal-backdrop"
                    onClick={() => setShowNotifPanel(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9000,
                        background: "rgba(2, 12, 27, 0.55)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-end",
                        padding: "72px 16px 16px",
                    }}
                >
                    <div
                        ref={notifPanelRef}
                        className="user-notif-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Notifications"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 360,
                            maxWidth: "100%",
                            maxHeight: "min(480px, calc(100vh - 96px))",
                            overflow: "auto",
                            borderRadius: 16,
                            background: "linear-gradient(165deg, #0f172a 0%, #0c1a2e 100%)",
                            border: "1px solid rgba(52,211,153,0.3)",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                            color: "#e2e8f0",
                        }}
                    >
                        <div
                            className="user-notif-panel-head"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 16px",
                                borderBottom: "1px solid rgba(148,163,184,0.2)",
                                position: "sticky",
                                top: 0,
                                background: "#0f172a",
                                zIndex: 1,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <NotifBellIcon size={16} />
                                <strong style={{ fontSize: 14 }}>
                                    Alerts &amp; notifications
                                    {unreadCount > 0 ? ` (${unreadCount} new)` : ""}
                                </strong>
                            </div>
                            <button
                                type="button"
                                className="user-notif-close"
                                onClick={() => setShowNotifPanel(false)}
                                aria-label="Close"
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: 4,
                                }}
                            >
                                <UserIcon name="close" size={16} />
                            </button>
                        </div>
                        {activeAlerts.length === 0 ? (
                            <div
                                className="user-notif-empty"
                                style={{
                                    padding: 28,
                                    textAlign: "center",
                                    color: "#94a3b8",
                                    fontSize: 13,
                                }}
                            >
                                No active notifications
                            </div>
                        ) : (
                            <ul
                                className="user-notif-list"
                                style={{
                                    listStyle: "none",
                                    margin: 0,
                                    padding: 10,
                                }}
                            >
                                {activeAlerts.map((a) => {
                                    const key = alertKey(a);
                                    const isRead = readAlertIds.has(key);
                                    const sev = (a.severity || "MEDIUM").toUpperCase();
                                    const sevColor =
                                        sev === "CRITICAL"
                                            ? "#ef4444"
                                            : sev === "HIGH"
                                              ? "#f97316"
                                              : sev === "LOW"
                                                ? "#22d3ee"
                                                : "#eab308";
                                    return (
                                        <li
                                            key={key}
                                            className={`user-notif-item severity-${sev.toLowerCase()} ${
                                                isRead ? "is-read" : "is-unread"
                                            }`}
                                            style={{
                                                padding: "12px 12px",
                                                marginBottom: 8,
                                                borderRadius: 12,
                                                background: isRead
                                                    ? "rgba(30,41,59,0.6)"
                                                    : "rgba(16,185,129,0.12)",
                                                borderLeft: `3px solid ${sevColor}`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    gap: 8,
                                                    marginBottom: 4,
                                                    fontSize: 11,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: sevColor,
                                                        fontWeight: 800,
                                                        letterSpacing: "0.04em",
                                                    }}
                                                >
                                                    {sev}
                                                    {a.active !== false && (
                                                        <b
                                                            style={{
                                                                marginLeft: 8,
                                                                color: "#34d399",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            ACTIVE
                                                        </b>
                                                    )}
                                                </span>
                                                {a.createdAt && (
                                                    <time style={{ color: "#94a3b8" }}>
                                                        {new Date(a.createdAt).toLocaleString(
                                                            "en-IN",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </time>
                                                )}
                                            </div>
                                            <strong
                                                style={{
                                                    display: "block",
                                                    fontSize: 13,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {a.title}
                                            </strong>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 12,
                                                    lineHeight: 1.45,
                                                    color: "#cbd5e1",
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            >
                                                {a.message}
                                            </p>
                                            {a.location && (
                                                <small
                                                    style={{
                                                        display: "block",
                                                        marginTop: 6,
                                                        color: "#94a3b8",
                                                        fontSize: 11,
                                                    }}
                                                >
                                                    {a.location}
                                                </small>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* EMERGENCY SOS MODAL */}
            {showEmergencyModal && (
                <div className="disastra-modal-backdrop" onClick={() => setShowEmergencyModal(false)}>
                    <div
                        className="disastra-modal-dialog emergency-dialog"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-header emergency-header">
                            <div className="modal-icon-badge danger">
                                <UserIcon name="sos" size={24} />
                            </div>
                            <div className="modal-header-text">
                                <h2>National Emergency Quick Dial</h2>
                                <p>Instant 24/7 disaster response helplines & rescue services</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setShowEmergencyModal(false)}
                                title="Close dialog"
                            >
                                <UserIcon name="close" size={18} />
                            </button>
                        </div>
                        <div className="emergency-numbers-grid">
                            {[
                                { number: "112", label: "National Unified Emergency", tag: "Toll Free / All Services", color: "#ef4444" },
                                { number: "1070", label: "NDMA National Control Room", tag: "Disaster Management", color: "#f97316" },
                                { number: "1077", label: "District Disaster Control", tag: "District Authority", color: "#eab308" },
                                { number: "108", label: "Emergency Medical & Ambulance", tag: "Health & Trauma", color: "#10b981" },
                                { number: "101", label: "Fire & Rescue Services", tag: "Fire Safety", color: "#f43f5e" },
                                { number: "100", label: "Police Emergency Assistance", tag: "Police Control", color: "#3b82f6" },
                            ].map((item) => (
                                <a
                                    key={item.number}
                                    href={`tel:${item.number}`}
                                    className="emergency-call-card"
                                    style={{ borderLeftColor: item.color }}
                                >
                                    <div className="call-card-badge" style={{ backgroundColor: item.color }}>
                                        <UserIcon name="helplines" size={16} />
                                    </div>
                                    <div className="call-card-content">
                                        <span className="call-card-tag">{item.tag}</span>
                                        <strong>{item.label}</strong>
                                        <div className="call-card-num" style={{ color: item.color }}>
                                            {item.number}
                                        </div>
                                    </div>
                                    <span className="call-now-pill">Call Now 📞</span>
                                </a>
                            ))}
                        </div>
                        <div className="emergency-modal-footer">
                            <button
                                type="button"
                                className="modal-action-btn primary"
                                onClick={() => {
                                    setShowEmergencyModal(false);
                                    scrollTo("report");
                                }}
                            >
                                <UserIcon name="report" size={16} /> Report Disaster Incident
                            </button>
                            <button
                                type="button"
                                className="modal-action-btn secondary"
                                onClick={() => {
                                    setShowEmergencyModal(false);
                                    scrollTo("map");
                                }}
                            >
                                <UserIcon name="map" size={16} /> Open Live Radar Map
                            </button>
                            <button
                                type="button"
                                className="modal-action-btn ghost"
                                onClick={() => setShowEmergencyModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal && (
                <div className="disastra-modal-backdrop" onClick={() => setShowLogoutModal(false)}>
                    <div
                        className="disastra-modal-dialog logout-dialog"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-icon-badge danger logout-icon">
                            <UserIcon name="logout" size={28} />
                        </div>
                        <h2>Sign Out of Disastra Portal?</h2>
                        <p>
                            You are currently signed in as <strong>{user.name || "User"}</strong> ({user.email || "user@disastra.local"}).
                            Signing out will conclude your active session on this device.
                        </p>
                        <div className="logout-dialog-actions">
                            <button
                                type="button"
                                className="modal-action-btn ghost"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Stay Logged In
                            </button>
                            <button
                                type="button"
                                className="modal-action-btn danger"
                                onClick={() => {
                                    localStorage.removeItem("disastra_user");
                                    localStorage.removeItem("disastra_token");
                                    navigate("/");
                                }}
                            >
                                <UserIcon name="logout" size={16} /> Yes, Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Payment success notification modal */}
            {paymentSuccess && (
                <div
                    className="modal-overlay"
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(2, 12, 27, 0.72)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                    }}
                    onClick={() => setPaymentSuccess(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 420,
                            borderRadius: 24,
                            background: "linear-gradient(165deg, #0f766e 0%, #134e4a 40%, #0c1a2e 100%)",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(45,212,191,0.25)",
                            padding: "32px 28px 24px",
                            color: "#ecfdf5",
                            textAlign: "center",
                            animation: "fundPop 0.35s ease-out",
                        }}
                    >
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                margin: "0 auto 16px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #34d399, #10b981)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 24px rgba(16,185,129,0.45)",
                            }}
                        >
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        </div>
                        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Payment Successful
                        </h2>
                        <p style={{ margin: "0 0 20px", opacity: 0.9, fontSize: 14, lineHeight: 1.5 }}>
                            Thank you, <strong>{paymentSuccess.name}</strong>. Your contribution helps communities recover faster.
                        </p>
                        <div
                            style={{
                                background: "rgba(0,0,0,0.25)",
                                borderRadius: 16,
                                padding: "14px 16px",
                                marginBottom: 18,
                                textAlign: "left",
                                fontSize: 13,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ opacity: 0.75 }}>Amount</span>
                                <strong style={{ fontSize: 16, color: "#6ee7b7" }}>
                                    ₹{Number(paymentSuccess.amount).toFixed(2)}
                                </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ opacity: 0.75 }}>Payment ID</span>
                                <span style={{ fontFamily: "monospace", fontSize: 11 }}>{paymentSuccess.paymentId || "—"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ opacity: 0.75 }}>Receipt email</span>
                                <span>{paymentSuccess.email}</span>
                            </div>
                        </div>
                        <p style={{ margin: "0 0 18px", fontSize: 12, opacity: 0.8 }}>
                            A confirmation email has been sent to your inbox.
                        </p>
                        <button
                            type="button"
                            onClick={() => setPaymentSuccess(null)}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: 12,
                                border: "none",
                                background: "linear-gradient(90deg, #14b8a6, #10b981)",
                                color: "#042f2e",
                                fontWeight: 800,
                                fontSize: 15,
                                cursor: "pointer",
                                boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
                            }}
                        >
                            Done
                        </button>
                    </div>
                    <style>{`
                        @keyframes fundPop {
                            from { opacity: 0; transform: scale(0.92) translateY(12px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>
                </div>
            )}

            <AIAssist compact context={{ disasters, climate }} />
        </div>
    );
}

export default UserDashboard;
