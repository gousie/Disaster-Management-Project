import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import api from "../../api/api";

import DisasterMap from "../../components/DisasterMap";

import AdminChatPanel from "../../components/AdminChatPanel";
import ThemeToggle from "../../components/ThemeToggle";
import { getExtras, setExtras } from "../../utils/disasterExtras";

import { getDisasterImage as resolveDisasterImage, normalizeImageUrl, fileToDataUrl } from "../../utils/disasterImages";
import { uploadImageFile, absoluteMediaUrl } from "../../utils/uploadImage";
import { setDisasterImage, mergeImageOverrides, getDisasterImageOverride, subscribeImages } from "../../utils/imageSync";
import { subscribeLive, broadcastLive } from "../../utils/liveSync";

import { chatStore } from "../../services/chatStore";
import {
    getVideos,
    addVideo,
    deleteVideo,
    getWhatsNew,
    addWhatsNew,
    deleteWhatsNew,
    getGuidelines,
    addGuideline,
    deleteGuideline,
    getHelplines,
    addHelpline,
    deleteHelpline,
    parseYoutubeId,
    subscribeContent,
    type AwarenessVideo,
    type WhatsNewItem,
    type GuidelineItem,
    type HelplineItem,
} from "../../services/contentStore";

import "./AdminDashboard.css";


/* =========================================================
   TYPES
========================================================= */

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

interface Volunteer {
    id?: number;
    name: string;
    mobile: string;
    email: string;
    skill: string;
    location: string;
    availability: string;
    status: string;
}

interface Resource {
    id?: number;
    name: string;
    category: string;
    quantity: number;
    location: string;
    status: string;
}

interface Alert {
    id?: number;
    title: string;
    message: string;
    severity: string;
    location: string;
    active: boolean;
    createdAt?: string;
}

interface Climate {
    location: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    condition: string;
}


/* =========================================================
   ICON COMPONENT
========================================================= */

function Icon({
    name,
    size = 20,
}: {
    name: string;
    size?: number;
}) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    };

    switch (name) {

        case "dashboard":
            return (
                <svg {...common}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            );

        case "disaster":
            return (
                <svg {...common}>
                    <path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.75 3h15.5a2 2 0 0 0 1.75-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
                    <path d="M12 8v5" />
                    <path d="M12 17h.01" />
                </svg>
            );

        case "map":
            return (
                <svg {...common}>
                    <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
                    <path d="M9 3v15" />
                    <path d="M15 6v15" />
                </svg>
            );

        case "weather":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                </svg>
            );

        case "volunteer":
            return (
                <svg {...common}>
                    <circle cx="12" cy="8" r="3" />
                    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                    <path d="M19 8h3" />
                    <path d="M20.5 6.5v3" />
                </svg>
            );

        case "resource":
            return (
                <svg {...common}>
                    <path d="M4 7h16" />
                    <path d="M5 7v12h14V7" />
                    <path d="M8 7V4h8v3" />
                    <path d="M9 11h6" />
                    <path d="M9 15h6" />
                </svg>
            );

        case "notification":
            return (
                <svg {...common}>
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                </svg>
            );

        case "plus":
            return (
                <svg {...common}>
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                </svg>
            );

        case "edit":
            return (
                <svg {...common}>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
            );

        case "trash":
            return (
                <svg {...common}>
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 15H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                </svg>
            );

        case "search":
            return (
                <svg {...common}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                </svg>
            );

        case "logout":
            return (
                <svg {...common}>
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                </svg>
            );

        case "temperature":
            return (
                <svg {...common}>
                    <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
                    <path d="M12 7v8" />
                </svg>
            );

        case "water":
            return (
                <svg {...common}>
                    <path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" />
                </svg>
            );

        case "wind":
            return (
                <svg {...common}>
                    <path d="M3 8h11a3 3 0 1 0-3-3" />
                    <path d="M3 12h15a3 3 0 1 1-3 3" />
                    <path d="M3 16h7" />
                </svg>
            );

        case "rain":
            return (
                <svg {...common}>
                    <path d="M7 18a4 4 0 1 1 .5-7.97A5 5 0 0 1 17 11h1a3 3 0 1 1 0 6" />
                    <path d="m8 21 1-2" />
                    <path d="m12 21 1-2" />
                    <path d="m16 21 1-2" />
                </svg>
            );

        case "location":
            return (
                <svg {...common}>
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                </svg>
            );

        case "image":
            return (
                <svg {...common}>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="8.5" cy="9" r="1.5" />
                    <path d="m21 15-5-5L5 20" />
                </svg>
            );

        case "close":
            return (
                <svg {...common}>
                    <path d="m6 6 12 12" />
                    <path d="M18 6 6 18" />
                </svg>
            );

        case "refresh":
            return (
                <svg {...common}>
                    <path d="M20 11a8 8 0 0 0-14.9-3" />
                    <path d="M4 4v4h4" />
                    <path d="M4 13a8 8 0 0 0 14.9 3" />
                    <path d="M20 20v-4h-4" />
                </svg>
            );

        case "chevron-left":
            return (
                <svg {...common}>
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            );

        case "chevron-right":
            return (
                <svg {...common}>
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            );

        case "shield":
            return (
                <svg {...common}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            );

        case "broadcast":
            return (
                <svg {...common}>
                    <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                    <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M12 14v8" />
                </svg>
            );

        case "download":
            return (
                <svg {...common}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            );

        case "chat":
            return (
                <svg {...common}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            );

        default:
            return null;
    }
}


/* =========================================================
   DEFAULT VALUES
========================================================= */

const emptyDisaster: Disaster = {
    title: "",
    type: "",
    description: "",
    severity: "MEDIUM",
    location: "",
    latitude: null,
    longitude: null,
    status: "ACTIVE",
    imageUrl: "",
};

const emptyVolunteer: Volunteer = {
    name: "",
    mobile: "",
    email: "",
    skill: "",
    location: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
};

const emptyResource: Resource = {
    name: "",
    category: "",
    quantity: 1,
    location: "",
    status: "AVAILABLE",
};

const emptyAlert: Alert = {
    title: "",
    message: "",
    severity: "HIGH",
    location: "",
    active: true,
};

/** Download rows as CSV (Excel-friendly) */
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
        const s = v == null ? "" : String(v);
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const lines = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ];
    const blob = new Blob(["\ufeff" + lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard() {

    const navigate = useNavigate();

    const [activePage, setActivePage] =
        useState("dashboard");

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [severityFilter, setSeverityFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [selectedDisasterIds, setSelectedDisasterIds] = useState<number[]>([]);
    const [bulkBusy, setBulkBusy] = useState(false);

    const [disasters, setDisasters] =
        useState<Disaster[]>([]);

    const [volunteers, setVolunteers] =
        useState<Volunteer[]>([]);

    const [resources, setResources] =
        useState<Resource[]>([]);

    const [alerts, setAlerts] =
        useState<Alert[]>([]);

    const [funds, setFunds] = useState<any[]>([]);
    const [fundsLoading, setFundsLoading] = useState(false);

    const [videos, setVideosList] = useState<AwarenessVideo[]>(() => getVideos());
    const [whatsNewList, setWhatsNewList] = useState<WhatsNewItem[]>(() => getWhatsNew());
    const [guidelinesList, setGuidelinesList] = useState<GuidelineItem[]>(() => getGuidelines());
    const [helplinesList, setHelplinesList] = useState<HelplineItem[]>(() => getHelplines());
    const [videoForm, setVideoForm] = useState({ youtubeUrl: "", title: "", description: "" });
    const [wnForm, setWnForm] = useState({ title: "", date: "", summary: "", link: "" });
    const [glForm, setGlForm] = useState({ title: "", releaseDate: "", category: "" });
    const [hlForm, setHlForm] = useState({ name: "", number: "", note: "" });
    const [contentMsg, setContentMsg] = useState("");
    const [hudClock, setHudClock] = useState(() =>
        new Date().toLocaleTimeString("en-IN", { hour12: false })
    );

    const [climate, setClimate] =
        useState<Climate | null>(null);


    /* FORMS */

    const [disasterForm, setDisasterForm] =
        useState<Disaster>(emptyDisaster);

    const [volunteerForm, setVolunteerForm] =
        useState<Volunteer>(emptyVolunteer);

    const [resourceForm, setResourceForm] =
        useState<Resource>(emptyResource);

    const [alertForm, setAlertForm] =
        useState<Alert>(emptyAlert);


    /* EDIT IDS */

    const [editingDisasterId, setEditingDisasterId] =
        useState<number | null>(null);

    const [editingVolunteerId, setEditingVolunteerId] =
        useState<number | null>(null);

    const [editingResourceId, setEditingResourceId] =
        useState<number | null>(null);

    const [editingAlertId, setEditingAlertId] =
        useState<number | null>(null);


    /* UI */

    const [loading, setLoading] =
        useState(false);

    const [extraDetailsForm, setExtraDetailsForm] = useState("");
    const [galleryForm, setGalleryForm] = useState<string[]>([]);
    const [search, setSearch] =
        useState("");

    const [notificationOpen, setNotificationOpen] =
        useState(false);

    const [mobileMenu, setMobileMenu] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    /* Bumps every time an image link is edited or a disaster is saved,
       so the <img> elements remount and refetch even when the pasted
       URL text itself hasn't changed (e.g. same Drive link, new file). */
    const [imageRefreshToken, setImageRefreshToken] =
        useState<number>(Date.now());

    /* Holds imageUrl values the user has set locally, keyed by disaster
       id. Applied on top of every /disasters fetch so the image the
       user picked keeps showing even if the backend hasn't actually
       persisted it yet (or drops it on the way back). A ref (not
       state) so loadDisasters — captured once by the auto-refresh
       interval — always reads the latest overrides instead of a
       stale closure. */
    const imageOverridesRef =
        useRef<Record<number, string>>({});


    /* =====================================================
       LOAD DISASTERS
    ===================================================== */

    const loadDisasters = async () => {

        try {

            const response =
                await api.get("/disasters");

            const data =
                response.data as Disaster[];

            // Re-apply any locally-set image links on top of whatever
            // the server returned, so a save that the backend hasn't
            // actually persisted yet doesn't visually revert.
            // Hydrate local ref from persistent image sync (survives logout)
            data.forEach((d) => {
                if (d.id === undefined) return;
                const synced = getDisasterImageOverride(d.id);
                if (synced) {
                    imageOverridesRef.current[d.id] = synced;
                } else if (d.imageUrl && d.imageUrl.trim()) {
                    const abs = absoluteMediaUrl(d.imageUrl.trim());
                    imageOverridesRef.current[d.id] = abs;
                    setDisasterImage(d.id, abs, d.title);
                }
            });

            const merged = mergeImageOverrides(
                data.map((d) => {
                    const override =
                        d.id !== undefined
                            ? imageOverridesRef.current[d.id]
                            : undefined;
                    return override
                        ? { ...d, imageUrl: override }
                        : d;
                })
            );

            setDisasters(merged);

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load disasters"
            );
        }
    };


    /* =====================================================
       LOAD VOLUNTEERS
    ===================================================== */

    const loadVolunteers = async () => {

        try {

            const response =
                await api.get(
                    "/volunteers"
                );

            setVolunteers(
                response.data
            );

        } catch (err) {

            console.error(err);
        }
    };


    /* =====================================================
       LOAD RESOURCES
    ===================================================== */

    const loadResources = async () => {

        try {

            const response =
                await api.get(
                    "/resources"
                );

            setResources(
                response.data
            );

        } catch (err) {

            console.error(err);
        }
    };


    /* =====================================================
       LOAD ALERTS
    ===================================================== */

    const loadAlerts = async () => {

        try {

            const response =
                await api.get(
                    "/alerts"
                );

            setAlerts(
                response.data
            );

        } catch (err) {

            console.error(err);
        }
    };


    /* =====================================================
       LOAD CLIMATE
    ===================================================== */

    const loadClimate = async () => {

        try {

            const response =
                await api.get(
                    "/climate?latitude=16.3067&longitude=80.4365"
                );

            setClimate(
                response.data
            );

        } catch (err) {

            console.error(err);
        }
    };


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {

        loadDisasters();
        loadVolunteers();
        loadResources();
        loadAlerts();
        loadClimate();

        const refreshContent = () => {
            setVideosList(getVideos());
            setWhatsNewList(getWhatsNew());
            setGuidelinesList(getGuidelines());
            setHelplinesList(getHelplines());
        };
        const unsub = subscribeContent(refreshContent);
        const unsubImg = subscribeImages(() => loadDisasters());
        const unsubLive = subscribeLive(() => loadDisasters());
        const clockTimer = setInterval(() => {
            setHudClock(new Date().toLocaleTimeString("en-IN", { hour12: false }));
        }, 1000);
        return () => {
            unsub();
            unsubImg();
            unsubLive();
            clearInterval(clockTimer);
        };

    }, []);


    /* =====================================================
       AUTO REFRESH
    ===================================================== */

    useEffect(() => {

        const timer =
            setInterval(() => {

                loadDisasters();
                loadAlerts();
                loadVolunteers();
                loadResources();

            }, 4000);

        return () =>
            clearInterval(timer);

    }, []);


    /* =====================================================
       FLASH MESSAGE
    ===================================================== */

    const showMessage = (
        text: string
    ) => {

        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 3500);
    };


    /* =====================================================
       DISASTER FORM
    ===================================================== */

    const handleDisasterChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) => {

        const {
            name,
            value,
        } = e.target;

        if (name === "imageUrl") {
            setImageRefreshToken(Date.now());
            // save gallery + extra details for post click modal
            try {
                const idForExtras = editingDisasterId ?? null;
                // create path may use response - handled below if needed
                if (idForExtras) {
                    setExtras(
                        idForExtras,
                        {
                            extraDetails: extraDetailsForm,
                            gallery: galleryForm,
                        },
                        disasterForm.title
                    );
                }
            } catch (_) {}

        }

        setDisasterForm(
            (prev) => ({
                ...prev,
                [name]:
                    name === "latitude" ||
                    name === "longitude"
                        ? value === ""
                            ? null
                            : Number(value)
                        : value,
            })
        );
    };


    /* =====================================================
       SAVE DISASTER
    ===================================================== */

    const saveDisaster = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        setLoading(true);
        setError("");

        try {

            if (editingDisasterId) {

                const response = await api.put(
                    `/disasters/${editingDisasterId}`,
                    {
                        title: disasterForm.title,
                        type: disasterForm.type,
                        description: disasterForm.description,
                        severity: disasterForm.severity,
                        location: disasterForm.location,
                        latitude: disasterForm.latitude,
                        longitude: disasterForm.longitude,
                        status: disasterForm.status,
                        imageUrl: normalizeImageUrl(disasterForm.imageUrl) || disasterForm.imageUrl || "",
                    }
                );

                // Update the card immediately with the data
                // returned by the backend, instead of waiting
                // on a full reload.
                setDisasters((prev) =>
                    prev.map((d) =>
                        d.id === editingDisasterId
                            ? {
                                  ...d,
                                  ...response.data,
                                  imageUrl:
                                      response.data
                                          ?.imageUrl ??
                                      disasterForm.imageUrl,
                              }
                            : d
                    )
                );

                // Remember this image link so it keeps showing
                // even if the next auto-refresh fetches a backend
                // record that hasn't actually saved it.
                if (
                    disasterForm.imageUrl &&
                    disasterForm.imageUrl.trim() !== ""
                ) {
                    imageOverridesRef.current[
                        editingDisasterId
                    ] = disasterForm.imageUrl.trim();
                    setDisasterImage(editingDisasterId, absoluteMediaUrl(normalizeImageUrl(disasterForm.imageUrl) || disasterForm.imageUrl.trim()), disasterForm.title);
                }

                showMessage(
                    "Disaster updated successfully"
                );
                if (editingDisasterId) {
                    setExtras(
                        editingDisasterId,
                        {
                            extraDetails: extraDetailsForm,
                            gallery: galleryForm,
                        },
                        disasterForm.title
                    );
                }

            } else {

                const response = await api.post(
                    "/disasters",
                    {
                        title: disasterForm.title,
                        type: disasterForm.type,
                        description: disasterForm.description,
                        severity: disasterForm.severity,
                        location: disasterForm.location,
                        latitude: disasterForm.latitude,
                        longitude: disasterForm.longitude,
                        status: disasterForm.status,
                        imageUrl: normalizeImageUrl(disasterForm.imageUrl) || disasterForm.imageUrl || "",
                    }
                );

                // Add the newly created disaster immediately.
                setDisasters((prev) => [
                    ...prev,
                    response.data,
                ]);

                // Remember this image link for the same reason as
                // the edit branch above.
                if (
                    response.data?.id !== undefined &&
                    disasterForm.imageUrl &&
                    disasterForm.imageUrl.trim() !== ""
                ) {
                    imageOverridesRef.current[
                        response.data.id
                    ] = disasterForm.imageUrl.trim();
                    setDisasterImage(response.data.id, absoluteMediaUrl(normalizeImageUrl(disasterForm.imageUrl) || disasterForm.imageUrl.trim()), disasterForm.title);
                    setExtras(
                        response.data.id,
                        {
                            extraDetails: extraDetailsForm,
                            gallery: galleryForm,
                        },
                        disasterForm.title
                    );

                }

                showMessage(
                    "Disaster created successfully"
                );
            }

            // Force every image to remount/refetch.
            setImageRefreshToken(Date.now());

            setDisasterForm({
                ...emptyDisaster,
            });

            setEditingDisasterId(null);
            setExtraDetailsForm("");
            setGalleryForm([]);


        } catch (err) {

            console.error(
                "SAVE DISASTER ERROR:",
                err
            );

            setError(
                "Unable to save disaster"
            );

        } finally {

            setLoading(false);
        }
    };


    /* =====================================================
       EDIT DISASTER
    ===================================================== */

    const editDisaster = (
        disaster: Disaster
    ) => {

        setDisasterForm({
            ...disaster,
            latitude:
                disaster.latitude ??
                null,
            longitude:
                disaster.longitude ??
                null,
            imageUrl:
                disaster.imageUrl ??
                "",
        });

        setEditingDisasterId(
            disaster.id ?? null
        );

        {
            const ex = getExtras(disaster.id);
            setExtraDetailsForm(ex.extraDetails || "");
            setGalleryForm(ex.gallery || []);
        }

        setActivePage(
            "disasters"
        );

        // Scroll DOWN to the disaster form (not to the top of the page).
        // The small delay lets React finish rendering the form with the
        // new values before we try to scroll to it.
        setTimeout(() => {

            document
                .getElementById("disaster-form")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

        }, 50);
    };


    /* =====================================================
       DELETE DISASTER
    ===================================================== */

    const deleteDisaster = async (
        id?: number
    ) => {

        if (!id) return;

        if (
            !window.confirm(
                "Delete this disaster?"
            )
        ) {
            return;
        }

        try {

            await api.delete(
                `/disasters/${id}`
            );

            delete imageOverridesRef.current[id];

            await loadDisasters();

            showMessage(
                "Disaster deleted"
            );

        } catch (err) {

            console.error(err);

            setError(
                "Unable to delete disaster"
            );
        }
    };


    /* =====================================================
       VOLUNTEER FORM
    ===================================================== */

    const handleVolunteerChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement
        >
    ) => {

        const {
            name,
            value,
        } = e.target;

        setVolunteerForm(
            (prev) => ({
                ...prev,
                [name]: value,
            })
        );
    };


    const saveVolunteer = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        try {

            if (editingVolunteerId) {

                await api.put(
                    `/volunteers/${editingVolunteerId}`,
                    volunteerForm
                );

                showMessage(
                    "Volunteer updated"
                );

            } else {

                await api.post(
                    "/volunteers",
                    volunteerForm
                );

                showMessage(
                    "Volunteer added"
                );
            }

            setVolunteerForm(
                emptyVolunteer
            );

            setEditingVolunteerId(
                null
            );

            await loadVolunteers();

        } catch (err) {

            console.error(err);

            setError(
                "Unable to save volunteer"
            );
        }
    };


    const deleteVolunteer = async (
        id?: number
    ) => {

        if (!id) return;

        if (
            !window.confirm(
                "Delete this volunteer?"
            )
        ) {
            return;
        }

        try {

            await api.delete(
                `/volunteers/${id}`
            );

            await loadVolunteers();

            showMessage(
                "Volunteer deleted"
            );

        } catch (err) {

            console.error(err);
        }
    };


    /* =====================================================
       RESOURCE FORM
    ===================================================== */

    const handleResourceChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement
        >
    ) => {

        const {
            name,
            value,
        } = e.target;

        setResourceForm(
            (prev) => ({
                ...prev,
                [name]:
                    name === "quantity"
                        ? Number(value)
                        : value,
            })
        );
    };


    const saveResource = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        try {

            if (editingResourceId) {

                await api.put(
                    `/resources/${editingResourceId}`,
                    resourceForm
                );

                showMessage(
                    "Resource updated"
                );

            } else {

                await api.post(
                    "/resources",
                    resourceForm
                );

                showMessage(
                    "Resource added"
                );
            }

            setResourceForm(
                emptyResource
            );

            setEditingResourceId(
                null
            );

            await loadResources();

        } catch (err) {

            console.error(err);

            setError(
                "Unable to save resource"
            );
        }
    };


    const deleteResource = async (
        id?: number
    ) => {

        if (!id) return;

        if (
            !window.confirm(
                "Delete this resource?"
            )
        ) {
            return;
        }

        try {

            await api.delete(
                `/resources/${id}`
            );

            await loadResources();

            showMessage(
                "Resource deleted"
            );

        } catch (err) {

            console.error(err);
        }
    };


    /* =====================================================
       ALERT FORM
    ===================================================== */

    const handleAlertChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) => {

        const {
            name,
            value,
        } = e.target;

        setAlertForm(
            (prev) => ({
                ...prev,
                [name]: value,
            })
        );
    };


    const saveAlert = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        try {

            if (editingAlertId) {

                await api.put(
                    `/alerts/${editingAlertId}`,
                    alertForm
                );

                showMessage(
                    "Notification updated"
                );

            } else {

                await api.post(
                    "/alerts",
                    alertForm
                );

                showMessage(
                    "Notification published"
                );
            }

            setAlertForm(
                emptyAlert
            );

            setEditingAlertId(
                null
            );

            await loadAlerts();

        } catch (err) {

            console.error(err);

            setError(
                "Unable to save notification"
            );
        }
    };


    const deleteAlert = async (
        id?: number
    ) => {

        if (!id) return;

        if (
            !window.confirm(
                "Delete this notification?"
            )
        ) {
            return;
        }

        try {

            await api.delete(
                `/alerts/${id}`
            );

            await loadAlerts();

            showMessage(
                "Notification deleted"
            );

        } catch (err) {

            console.error(err);
        }
    };


    /* =====================================================
       IMAGE URL
    ===================================================== */

    const getDisasterImage = (
        disaster: Disaster
    ) => {
        return resolveDisasterImage(disaster, imageRefreshToken);
    };


    /* =====================================================
       SEARCH
    ===================================================== */

    const filteredDisasters =
        useMemo(() => {
            const query = search.toLowerCase().trim();
            return disasters.filter((d) => {
                if (
                    statusFilter !== "ALL" &&
                    (d.status || "").toUpperCase() !== statusFilter
                ) {
                    return false;
                }
                if (
                    severityFilter !== "ALL" &&
                    (d.severity || "").toUpperCase() !== severityFilter
                ) {
                    return false;
                }
                if (
                    typeFilter !== "ALL" &&
                    (d.type || "").toUpperCase() !== typeFilter
                ) {
                    return false;
                }
                if (!query) return true;
                return (
                    d.title?.toLowerCase().includes(query) ||
                    d.type?.toLowerCase().includes(query) ||
                    d.location?.toLowerCase().includes(query) ||
                    d.severity?.toLowerCase().includes(query) ||
                    d.status?.toLowerCase().includes(query)
                );
            });
        }, [disasters, search, statusFilter, severityFilter, typeFilter]);

    const pendingReports = useMemo(
        () =>
            disasters.filter(
                (d) => (d.status || "").toUpperCase() === "PENDING"
            ),
        [disasters]
    );

    const lowStockResources = useMemo(
        () =>
            resources.filter((r) => {
                const st = (r.status || "").toUpperCase();
                return (
                    st === "LOW" ||
                    st === "OUT_OF_STOCK" ||
                    (typeof r.quantity === "number" && r.quantity <= 5)
                );
            }),
        [resources]
    );

    const fundsPaidTotal = useMemo(
        () =>
            funds
                .filter((f: any) => f.status === "PAID")
                .reduce((s: number, f: any) => s + Number(f.amount || 0), 0),
        [funds]
    );

    const exportDisastersCsv = () => {
        downloadCsv(
            `disastra-disasters-${new Date().toISOString().slice(0, 10)}.csv`,
            filteredDisasters.map((d) => ({
                id: d.id,
                title: d.title,
                type: d.type,
                severity: d.severity,
                status: d.status,
                location: d.location,
                latitude: d.latitude,
                longitude: d.longitude,
                description: d.description,
                createdAt: d.createdAt,
            }))
        );
        showMessage("Disasters CSV downloaded");
    };

    const exportFundsCsv = () => {
        downloadCsv(
            `disastra-funds-${new Date().toISOString().slice(0, 10)}.csv`,
            funds.map((f: any) => ({
                id: f.id,
                donorName: f.donorName,
                donorEmail: f.donorEmail,
                donorMobile: f.donorMobile,
                amount: f.amount,
                status: f.status,
                paymentId: f.razorpayPaymentId,
                paidAt: f.paidAt,
            }))
        );
        showMessage("Funds CSV downloaded");
    };

    const exportVolunteersCsv = () => {
        downloadCsv(
            `disastra-volunteers-${new Date().toISOString().slice(0, 10)}.csv`,
            volunteers.map((v) => ({
                id: v.id,
                name: v.name,
                mobile: v.mobile,
                email: v.email,
                skill: v.skill,
                location: v.location,
                availability: v.availability,
                status: v.status,
            }))
        );
        showMessage("Volunteers CSV downloaded");
    };

    const bulkSetStatus = async (status: string) => {
        if (!selectedDisasterIds.length) return;
        if (
            !window.confirm(
                `Set ${selectedDisasterIds.length} incident(s) to ${status}?`
            )
        ) {
            return;
        }
        setBulkBusy(true);
        try {
            for (const id of selectedDisasterIds) {
                const d = disasters.find((x) => x.id === id);
                if (!d) continue;
                await api.put(`/disasters/${id}`, { ...d, status });
            }
            setSelectedDisasterIds([]);
            await loadDisasters();
            showMessage(`Updated ${selectedDisasterIds.length} to ${status}`);
        } catch {
            setError("Bulk update failed");
        } finally {
            setBulkBusy(false);
        }
    };

    const toggleSelectDisaster = (id?: number) => {
        if (id == null) return;
        setSelectedDisasterIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };


    /* =====================================================
       STATS
    ===================================================== */

    const activeDisasters =
        disasters.filter(
            (d) =>
                d.status?.toUpperCase() ===
                "ACTIVE"
        );

    const criticalDisasters =
        disasters.filter(
            (d) =>
                d.severity?.toUpperCase() ===
                    "CRITICAL" ||
                d.severity?.toUpperCase() ===
                    "HIGH"
        );

    const availableVolunteers =
        volunteers.filter(
            (v) =>
                v.availability
                    ?.toUpperCase() ===
                "AVAILABLE"
        );

    const availableResources =
        resources.filter(
            (r) =>
                r.status
                    ?.toUpperCase() ===
                "AVAILABLE"
        );

    const activeAlerts =
        alerts.filter(
            (a) => a.active
        );


    /* =====================================================
       NAVIGATION
    ===================================================== */

    const goTo = (
        page: string
    ) => {

        setActivePage(page);
        setMobileMenu(false);

        setTimeout(() => {

            const element =
                document.getElementById(
                    page
                );

            element?.scrollIntoView({
                behavior: "smooth",
            });

        }, 50);
    };


    return (
        <div className="admin-layout">


            {/* =================================================
               MOBILE OVERLAY
            ================================================= */}

            {mobileMenu && (
                <div
                    className="mobile-overlay"
                    onClick={() =>
                        setMobileMenu(false)
                    }
                />
            )}


            {/* =================================================
               SIDEBAR
            ================================================= */}

            <aside
                className={`admin-sidebar ${
                    mobileMenu
                        ? "sidebar-open"
                        : ""
                }`}
            >

                <div className="brand">

                    <div className="brand-mark">
                        D
                    </div>

                    <div className="brand-content">
                        <h2>
                            DISASTRA
                        </h2>

                        <span>
                            ADMIN CONTROL
                        </span>
                    </div>

                    <button
                        className="mobile-close"
                        onClick={() =>
                            setMobileMenu(false)
                        }
                    >
                        <Icon
                            name="close"
                            size={18}
                        />
                    </button>

                </div>


                <div className="admin-status">

                    <span className="status-dot" />

                    <div>
                        <strong>
                            System Operational
                        </strong>

                        <small>
                            All services online
                        </small>
                    </div>

                </div>


                <nav className="sidebar-nav">

                    <button
                        className={
                            activePage ===
                            "dashboard"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("dashboard")
                        }
                    >
                        <Icon
                            name="dashboard"
                        />

                        <span>
                            Dashboard
                        </span>
                    </button>


                    <button
                        className={
                            activePage ===
                            "disasters"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("disasters")
                        }
                    >
                        <Icon
                            name="disaster"
                        />

                        <span>
                            Disasters
                        </span>

                        <b>
                            {activeDisasters.length}
                        </b>
                    </button>

                    <button
                        className={
                            activePage === "approvals" ? "active" : ""
                        }
                        onClick={() => goTo("approvals")}
                        title="Pending user reports"
                    >
                        <Icon name="notification" />
                        <span>Approvals</span>
                        {pendingReports.length > 0 && (
                            <b style={{ background: "#ef4444", color: "#fff" }}>
                                {pendingReports.length}
                            </b>
                        )}
                    </button>


                    <button
                        className={
                            activePage ===
                            "map"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("map")
                        }
                    >
                        <Icon
                            name="map"
                        />

                        <span>
                            Live Map
                        </span>
                    </button>

                    <button
                        className={
                            activePage ===
                            "videos"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("videos")
                        }
                    >
                        <Icon
                            name="image"
                        />

                        <span>
                            Videos
                        </span>
                    </button>


                    <button
                        className={
                            activePage ===
                            "climate"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("climate")
                        }
                    >
                        <Icon
                            name="weather"
                        />

                        <span>
                            Climate
                        </span>
                    </button>


                    <button
                        className={
                            activePage ===
                            "volunteers"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("volunteers")
                        }
                    >
                        <Icon
                            name="volunteer"
                        />

                        <span>
                            Volunteers
                        </span>

                        <b>
                            {availableVolunteers.length}
                        </b>
                    </button>


                    <button
                        className={
                            activePage ===
                            "resources"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("resources")
                        }
                    >
                        <Icon
                            name="resource"
                        />

                        <span>
                            Resources
                        </span>
                    </button>


                    <button
                        className={
                            activePage ===
                            "chats"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("chats")
                        }
                    >
                        <Icon
                            name="notification"
                        />

                        <span>
                            User Chats
                        </span>

                        <b>
                            {chatStore.pendingCount()}
                        </b>
                    </button>

                    <button
                        className={
                            activePage ===
                            "notifications"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            goTo("notifications")
                        }
                    >
                        <Icon
                            name="notification"
                        />

                        <span>
                            Notifications
                        </span>

                        {activeAlerts.length >
                            0 && (
                            <b>
                                {activeAlerts.length}
                            </b>
                        )}
                    </button>

                    <button
                        className={
                            activePage === "funds"
                                ? "active"
                                : ""
                        }
                        onClick={() => {
                            goTo("funds");
                            (async () => {
                                try {
                                    setFundsLoading(true);
                                    const res = await api.get("/funds");
                                    setFunds(Array.isArray(res.data) ? res.data : []);
                                } catch (e) {
                                    console.error(e);
                                    setFunds([]);
                                } finally {
                                    setFundsLoading(false);
                                }
                            })();
                        }}
                    >
                        <Icon name="resource" />
                        <span>Funds</span>
                        {funds.length > 0 && <b>{funds.length}</b>}
                    </button>

                </nav>


                <div className="sidebar-bottom">

                    <div className="admin-profile">

                        <div className="profile-avatar">
                            A
                        </div>

                        <div>
                            <strong>
                                Administrator
                            </strong>

                            <span>
                                System Manager
                            </span>
                        </div>

                    </div>


                    <button
                        className="logout-button"
                        onClick={() => {
                            localStorage.removeItem("disastra_token");
                            localStorage.removeItem("disastra_user");
                            navigate("/");
                        }}
                    >
                        <Icon
                            name="logout"
                        />

                        Logout
                    </button>

                </div>

            </aside>


            {/* =================================================
               MAIN
            ================================================= */}

            <main className="admin-main">


                {/* =================================================
                   TOP HEADER
                ================================================= */}

                <header className="topbar">

                    <button
                        className="mobile-menu-button"
                        onClick={() =>
                            setMobileMenu(true)
                        }
                    >
                        <span />
                        <span />
                        <span />
                    </button>


                    <div className="topbar-title">

                        <span>
                            DISASTER MANAGEMENT
                        </span>

                        <h1>
                            
{activePage ===
                            "dashboard"
                                ? "Command Center"
                                : activePage
                                      .charAt(0)
                                      .toUpperCase() +
                                  activePage.slice(
                                      1
                                  )}
                        </h1>

                    </div>


                    <div className="topbar-actions">
                        <ThemeToggle />


                        <div className="search-box">

                            <Icon
                                name="search"
                                size={18}
                            />

                            <input
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Search disasters..."
                            />

                        </div>


                        <button
                            className="icon-button"
                            onClick={() =>
                                setNotificationOpen(
                                    !notificationOpen
                                )
                            }
                        >
                            <Icon
                                name="notification"
                                size={20}
                            />

                            {activeAlerts.length >
                                0 && (
                                <span className="notification-count">
                                    {activeAlerts.length}
                                </span>
                            )}
                        </button>


                        <button
                            className="refresh-button"
                            onClick={() => {
                                loadDisasters();
                                loadVolunteers();
                                loadResources();
                                loadAlerts();
                                loadClimate();
                            }}
                        >
                            <Icon
                                name="refresh"
                                size={18}
                            />

                            <span>
                                Refresh
                            </span>
                        </button>

                    </div>

                </header>


                {/* =================================================
                   NOTIFICATION POPUP
                ================================================= */}

                {notificationOpen && (

                    <div className="notification-panel">

                        <div className="notification-panel-header">

                            <div>
                                <strong>
                                    Notifications
                                </strong>

                                <small>
                                    {activeAlerts.length} active
                                </small>
                            </div>

                            <button
                                onClick={() =>
                                    setNotificationOpen(
                                        false
                                    )
                                }
                            >
                                <Icon
                                    name="close"
                                    size={17}
                                />
                            </button>

                        </div>


                        {activeAlerts.length ===
                        0 ? (

                            <div className="notification-empty">
                                No active notifications
                            </div>

                        ) : (

                            activeAlerts
                                .slice(0, 5)
                                .map((alert) => (

                                    <div
                                        className="notification-item"
                                        key={alert.id}
                                    >

                                        <div
                                            className={`notification-icon ${alert.severity?.toLowerCase()}`}
                                        >
                                            <Icon
                                                name="disaster"
                                                size={18}
                                            />
                                        </div>

                                        <div>

                                            <strong>
                                                {
                                                    alert.title
                                                }
                                            </strong>

                                            <p>
                                                {
                                                    alert.message
                                                }
                                            </p>

                                            <small>
                                                {
                                                    alert.location
                                                }
                                            </small>

                                        </div>

                                    </div>

                                ))

                        )}

                    </div>

                )}


                {/* =================================================
                   ALERTS
                ================================================= */}

                {message && (

                    <div className="toast success">
                        <span />
                        {message}
                    </div>

                )}

                {error && (

                    <div className="toast error">
                        <span />
                        {error}

                        <button
                            onClick={() =>
                                setError("")
                            }
                        >
                            <Icon
                                name="close"
                                size={15}
                            />
                        </button>
                    </div>

                )}


                {/* =================================================
                   DASHBOARD
                ================================================= */}

                <div
                    className="page-content"
                    id="dashboard"
                >


                    {/* HERO */}

                    <section className="dashboard-hero">

                        <div className="hero-content">

                            <span className="hero-label">
                                DISASTRA · NATIONAL DISASTER COMMAND
                            </span>

                            <h2>
                                Stronger Together,
                                <br />
                                Safer Forever
                            </h2>

                            <p>
                                Apex-style control center for disaster policy,
                                live incident management, resources, volunteers,
                                preparedness videos, and citizen support —
                                aligned with India’s NDMA vision.
                            </p>

                            <div className="hero-actions">

                                <button
                                    className="primary-button"
                                    onClick={() =>
                                        goTo(
                                            "disasters"
                                        )
                                    }
                                >
                                    <Icon
                                        name="plus"
                                        size={18}
                                    />

                                    Add Disaster
                                </button>

                                <button
                                    className="outline-button"
                                    onClick={() =>
                                        goTo(
                                            "map"
                                        )
                                    }
                                >
                                    <Icon
                                        name="map"
                                        size={18}
                                    />

                                    Open Live Map
                                </button>

                                <button
                                    className="outline-button"
                                    onClick={() =>
                                        goTo(
                                            "videos"
                                        )
                                    }
                                >
                                    Videos
                                </button>

                            </div>

                        </div>


                        <div className="hero-visual">

                            <div className="radar-ring ring-one" />
                            <div className="radar-ring ring-two" />
                            <div className="radar-ring ring-three" />

                            <div className="radar-center">

                                <Icon
                                    name="disaster"
                                    size={38}
                                />

                            </div>

                            <div className="radar-point point-one" />
                            <div className="radar-point point-two" />
                            <div className="radar-point point-three" />

                        </div>

                    </section>


                    {/* =================================================
                       STATISTICS
                    ================================================= */}

                    <section className="stats-grid">

                        <div className="stat-card">

                            <div className="stat-icon red">
                                <Icon
                                    name="disaster"
                                    size={24}
                                />
                            </div>

                            <div>
                                <span>
                                    Active Disasters
                                </span>

                                <strong>
                                    {
                                        activeDisasters.length
                                    }
                                </strong>

                                <small>
                                    Currently monitored
                                </small>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon orange">
                                <Icon
                                    name="notification"
                                    size={24}
                                />
                            </div>

                            <div>
                                <span>
                                    Critical Alerts
                                </span>

                                <strong>
                                    {
                                        criticalDisasters.length
                                    }
                                </strong>

                                <small>
                                    High priority cases
                                </small>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon blue">
                                <Icon
                                    name="volunteer"
                                    size={24}
                                />
                            </div>

                            <div>
                                <span>
                                    Available Volunteers
                                </span>

                                <strong>
                                    {
                                        availableVolunteers.length
                                    }
                                </strong>

                                <small>
                                    Ready for deployment
                                </small>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon green">
                                <Icon
                                    name="resource"
                                    size={24}
                                />
                            </div>

                            <div>
                                <span>
                                    Resources
                                </span>

                                <strong>
                                    {
                                        availableResources.length
                                    }
                                </strong>

                                <small>
                                    Available resources
                                </small>
                            </div>

                        </div>

                    </section>


                    {/* =================================================
                       CURRENT DISASTERS
                    ================================================= */}

                    {/* ========== USER CHATS ========== */}
                    <section
                        id="chats"
                        className="content-section"
                        style={{ padding: "24px 0 40px" }}
                    >
                        <div className="section-header" style={{ marginBottom: 20 }}>
                            <div>
                                <h2 style={{ margin: 0, color: "#f8fafc" }}>
                                    User chat desk
                                </h2>
                                <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>
                                    Accept pending requests to open a live thread with citizens.
                                    Requests appear when a user clicks Request admin chat (same browser).
                                </p>
                            </div>
                        </div>
                        <AdminChatPanel />
                    </section>



                    
                    {/* USER REPORT APPROVAL */}
                    <section id="approvals" className="section-block" style={{ marginBottom: 28 }}>
                        <div className="section-header">
                            <div>
                                <span className="section-eyebrow">MODERATION</span>
                                <h2>User reports — approve to publish</h2>
                                <p>
                                    When a user submits a disaster it stays PENDING.
                                    Approve to make it ACTIVE (visible to all users) or Reject to hide it.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gap: 12 }}>
                            {disasters.filter((d) => (d.status || "").toUpperCase() === "PENDING").length === 0 && (
                                <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: 14 }}>
                                    No pending user reports right now.
                                </div>
                            )}
                            {disasters
                                .filter((d) => (d.status || "").toUpperCase() === "PENDING")
                                .map((d) => (
                                    <div
                                        key={d.id}
                                        style={{
                                            display: "flex",
                                            gap: 16,
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            padding: 14,
                                            borderRadius: 14,
                                            border: "1px solid rgba(251, 191, 36, 0.35)",
                                            background: "rgba(251, 191, 36, 0.08)",
                                        }}
                                    >
                                        <img
                                            src={getDisasterImage(d)}
                                            alt=""
                                            style={{ width: 88, height: 64, objectFit: "cover", borderRadius: 10 }}
                                        />
                                        <div style={{ flex: 1, minWidth: 180 }}>
                                            <strong style={{ color: "#f8fafc" }}>{d.title}</strong>
                                            <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 4 }}>
                                                {d.type} · {d.severity} · {d.location}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                                                {(d.description || "").slice(0, 120)}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                type="button"
                                                className="primary-button"
                                                style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }}
                                                onClick={async () => {
                                                    if (!d.id) return;
                                                    try {
                                                        setLoading(true);
                                                        await api.put(`/disasters/${d.id}`, {
                                                            ...d,
                                                            status: "ACTIVE",
                                                            imageUrl: d.imageUrl || "",
                                                        });
                                                        if (d.imageUrl) setDisasterImage(d.id, d.imageUrl);
                                                        showMessage("Report approved — now public");
                                                        await loadDisasters();
                                                    } catch (e) {
                                                        setError("Unable to approve report");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                Approve & post
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!d.id) return;
                                                    try {
                                                        setLoading(true);
                                                        await api.put(`/disasters/${d.id}`, {
                                                            ...d,
                                                            status: "REJECTED",
                                                        });
                                                        showMessage("Report rejected");
                                                        await loadDisasters();
                                                    } catch (e) {
                                                        setError("Unable to reject report");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: 10,
                                                    border: "1px solid rgba(248,113,113,0.4)",
                                                    background: "rgba(239,68,68,0.15)",
                                                    color: "#fca5a5",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>

<section
                        className="section-block"
                        id="disasters"
                    >

                        <div className="section-header">

                            <div>

                                <span className="section-eyebrow">
                                    LIVE INCIDENTS
                                </span>

                                <h2>
                                    Current Disasters
                                </h2>

                                <p>
                                    Monitor reported
                                    incidents and
                                    emergency situations.
                                </p>

                            </div>

                            <button
                                className="primary-button"
                                onClick={() => {
                                    setEditingDisasterId(
                                        null
                                    );

                                    setDisasterForm(
                                        emptyDisaster
                                    );

                                    setTimeout(() => {

                                        document
                                            .getElementById("disaster-form")
                                            ?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "start",
                                            });

                                    }, 50);
                                }}
                            >
                                <Icon
                                    name="plus"
                                    size={18}
                                />

                                Add Disaster
                            </button>

                        </div>

                        {/* Advanced filters + export + bulk */}
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                                marginBottom: 16,
                                alignItems: "center",
                            }}
                        >
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(148,163,184,0.35)",
                                    background: "rgba(15,23,42,0.8)",
                                    color: "#e2e8f0",
                                }}
                            >
                                <option value="ALL">All statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PENDING">Pending</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(148,163,184,0.35)",
                                    background: "rgba(15,23,42,0.8)",
                                    color: "#e2e8f0",
                                }}
                            >
                                <option value="ALL">All severities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(148,163,184,0.35)",
                                    background: "rgba(15,23,42,0.8)",
                                    color: "#e2e8f0",
                                }}
                            >
                                <option value="ALL">All types</option>
                                <option value="FLOOD">Flood</option>
                                <option value="CYCLONE">Cyclone</option>
                                <option value="EARTHQUAKE">Earthquake</option>
                                <option value="LANDSLIDE">Landslide</option>
                                <option value="FIRE">Fire</option>
                                <option value="DROUGHT">Drought</option>
                                <option value="OTHER">Other</option>
                            </select>
                            <button
                                type="button"
                                className="outline-button"
                                onClick={exportDisastersCsv}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                            >
                                <Icon name="download" size={16} />
                                Export CSV
                            </button>
                            {selectedDisasterIds.length > 0 && (
                                <>
                                    <span style={{ color: "#94a3b8", fontSize: 13 }}>
                                        {selectedDisasterIds.length} selected
                                    </span>
                                    <button
                                        type="button"
                                        className="primary-button"
                                        disabled={bulkBusy}
                                        onClick={() => bulkSetStatus("ACTIVE")}
                                    >
                                        Bulk Active
                                    </button>
                                    <button
                                        type="button"
                                        className="outline-button"
                                        disabled={bulkBusy}
                                        onClick={() => bulkSetStatus("RESOLVED")}
                                    >
                                        Bulk Resolve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDisasterIds([])}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            color: "#94a3b8",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Clear
                                    </button>
                                </>
                            )}
                        </div>

                        {lowStockResources.length > 0 && activePage === "disasters" && null}

                        <div className="disaster-grid">

                            {filteredDisasters.length ===
                            0 ? (

                                <div className="empty-card">

                                    <Icon
                                        name="disaster"
                                        size={42}
                                    />

                                    <h3>
                                        No disasters found
                                    </h3>

                                    <p>
                                        Add a disaster
                                        report or change
                                        your search.
                                    </p>

                                </div>

                            ) : (

                                filteredDisasters.map(
                                    (disaster) => (

                                        <article
                                            className="disaster-card"
                                            key={
                                                disaster.id
                                            }
                                            style={{
                                                outline:
                                                    disaster.id != null &&
                                                    selectedDisasterIds.includes(
                                                        disaster.id
                                                    )
                                                        ? "2px solid #34d399"
                                                        : undefined,
                                            }}
                                        >
                                            <label
                                                style={{
                                                    position: "absolute",
                                                    zIndex: 5,
                                                    top: 10,
                                                    left: 10,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    background: "rgba(0,0,0,0.55)",
                                                    padding: "4px 8px",
                                                    borderRadius: 8,
                                                    cursor: "pointer",
                                                    fontSize: 11,
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        disaster.id != null &&
                                                        selectedDisasterIds.includes(
                                                            disaster.id
                                                        )
                                                    }
                                                    onChange={() =>
                                                        toggleSelectDisaster(
                                                            disaster.id
                                                        )
                                                    }
                                                />
                                                Select
                                            </label>

                                            <div className="disaster-image-wrap">

                                                <img
                                                    key={`${disaster.id}-${disaster.imageUrl}-${imageRefreshToken}`}
                                                    src={getDisasterImage(
                                                        disaster
                                                    )}
                                                    alt={
                                                        disaster.title
                                                    }
                                                    className="disaster-image"
                                                    onError={(e) => {
                                                        const img =
                                                            e.currentTarget;

                                                        if (
                                                            !img.dataset
                                                                .fallback
                                                        ) {
                                                            img.dataset.fallback =
                                                                "true";

                                                            img.src =
                                                                "https://images.unsplash.com/photo-1561485132-59468cd0b553?auto=format&fit=crop&w=900&q=80";
                                                        }
                                                    }}
                                                />

                                                <div className="image-overlay" />

                                                <span
                                                    className={`severity-badge ${disaster.severity?.toLowerCase()}`}
                                                >
                                                    {
                                                        disaster.severity
                                                    }
                                                </span>

                                                <span className="disaster-type-badge">
                                                    {
                                                        disaster.type
                                                    }
                                                </span>

                                            </div>


                                            <div className="disaster-card-body">

                                                <div className="disaster-card-title">

                                                    <h3>
                                                        {
                                                            disaster.title
                                                        }
                                                    </h3>

                                                    <span
                                                        className={
                                                            disaster.status
                                                                ?.toLowerCase() ===
                                                            "active"
                                                                ? "status-active"
                                                                : "status-closed"
                                                        }
                                                    >
                                                        <i />
                                                        {
                                                            disaster.status
                                                        }
                                                    </span>

                                                </div>


                                                <p className="disaster-description">
                                                    {
                                                        disaster.description
                                                    }
                                                </p>


                                                <div className="location-row">

                                                    <Icon
                                                        name="location"
                                                        size={16}
                                                    />

                                                    <span>
                                                        {
                                                            disaster.location
                                                        }
                                                    </span>

                                                </div>


                                                <div className="coordinates">

                                                    {typeof disaster.latitude ===
                                                        "number" &&
                                                    typeof disaster.longitude ===
                                                        "number" ? (
                                                        <>
                                                            {disaster.latitude.toFixed(
                                                                4
                                                            )}
                                                            ,{" "}
                                                            {disaster.longitude.toFixed(
                                                                4
                                                            )}
                                                        </>
                                                    ) : (
                                                        "Coordinates unavailable"
                                                    )}

                                                </div>


                                                <div className="card-actions">

                                                    <button
                                                        className="edit-action"
                                                        onClick={() =>
                                                            editDisaster(
                                                                disaster
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            name="edit"
                                                            size={16}
                                                        />

                                                        Edit
                                                    </button>


                                                    <button
                                                        className="delete-action"
                                                        onClick={() =>
                                                            deleteDisaster(
                                                                disaster.id
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            name="trash"
                                                            size={16}
                                                        />

                                                        Delete
                                                    </button>

                                                </div>

                                            </div>

                                        </article>

                                    )
                                )

                            )}

                        </div>

                    </section>


                    {/* =================================================
                       DISASTER FORM
                    ================================================= */}

                    <section
                        className="section-block"
                        id="disaster-form"
                    >

                        <div className="section-header">

                            <div>

                                <span className="section-eyebrow">
                                    INCIDENT MANAGEMENT
                                </span>

                                <h2>
                                    {editingDisasterId
                                        ? "Edit Disaster"
                                        : "Create Disaster Report"}
                                </h2>

                                <p>
                                    Add complete
                                    incident details,
                                    location and an
                                    image link.
                                </p>

                            </div>

                        </div>


                        <form
                            className="form-card"
                            onSubmit={
                                saveDisaster
                            }
                        >

                            <div className="form-grid">

                                <div className="form-field">

                                    <label>
                                        Disaster Title
                                    </label>

                                    <input
                                        name="title"
                                        value={
                                            disasterForm.title
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                        placeholder="Example: Major Flood in Guntur"
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Disaster Type
                                    </label>

                                    <select
                                        name="type"
                                        value={
                                            disasterForm.type
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select type
                                        </option>

                                        <option value="FLOOD">
                                            Flood
                                        </option>

                                        <option value="CYCLONE">
                                            Cyclone
                                        </option>

                                        <option value="EARTHQUAKE">
                                            Earthquake
                                        </option>

                                        <option value="LANDSLIDE">
                                            Landslide
                                        </option>

                                        <option value="FIRE">
                                            Fire
                                        </option>

                                        <option value="DROUGHT">
                                            Drought
                                        </option>

                                        <option value="OTHER">
                                            Other
                                        </option>

                                    </select>

                                </div>


                                <div className="form-field">

                                    <label>
                                        Severity
                                    </label>

                                    <select
                                        name="severity"
                                        value={
                                            disasterForm.severity
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                    >

                                        <option value="LOW">
                                            Low
                                        </option>

                                        <option value="MEDIUM">
                                            Medium
                                        </option>

                                        <option value="HIGH">
                                            High
                                        </option>

                                        <option value="CRITICAL">
                                            Critical
                                        </option>

                                    </select>

                                </div>


                                <div className="form-field">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            disasterForm.status
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                    >

                                        <option value="PENDING">
                                            Pending (user report)
                                        </option>

                                        <option value="ACTIVE">
                                            Active (public)
                                        </option>

                                        <option value="REJECTED">
                                            Rejected
                                        </option>

                                        <option value="RESOLVED">
                                            Resolved
                                        </option>

                                        <option value="CLOSED">
                                            Closed
                                        </option>

                                    </select>

                                </div>


                                <div className="form-field full">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            disasterForm.description
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                        placeholder="Describe the disaster, affected areas, current situation and important information..."
                                        rows={5}
                                        required
                                    />

                                </div>


                                <div className="form-field full">

                                    <label>
                                        Location
                                    </label>

                                    <input
                                        name="location"
                                        value={
                                            disasterForm.location
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                        placeholder="Guntur, Andhra Pradesh"
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Latitude
                                    </label>

                                    <input
                                        type="number"
                                        step="any"
                                        name="latitude"
                                        value={
                                            disasterForm.latitude ??
                                            ""
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                        placeholder="16.3067"
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Longitude
                                    </label>

                                    <input
                                        type="number"
                                        step="any"
                                        name="longitude"
                                        value={
                                            disasterForm.longitude ??
                                            ""
                                        }
                                        onChange={
                                            handleDisasterChange
                                        }
                                        placeholder="80.4365"
                                    />

                                </div>


                                <div className="form-field full">

                                    <label>
                                        Disaster Image
                                    </label>

                                    <input
                                        type="text"
                                        name="imageUrl"
                                        value={
                                            disasterForm.imageUrl ??
                                            ""
                                        }
                                        onChange={(e) => {
                                            const normalized =
                                                normalizeImageUrl(
                                                    e.target.value
                                                );
                                            setDisasterForm((prev) => ({
                                                ...prev,
                                                imageUrl: normalized || e.target.value,
                                            }));
                                            setImageRefreshToken(
                                                Date.now()
                                            );
                                        }}
                                        placeholder="Paste image URL or upload a file below"
                                    />

                                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                        <label
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "10px 14px",
                                                borderRadius: 12,
                                                background: "rgba(37,99,235,0.2)",
                                                border: "1px solid rgba(96,165,250,0.4)",
                                                color: "#e0f2fe",
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Upload image file
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: "none" }}
                                                onChange={async (e) => {
                                                    const file =
                                                        e.target.files?.[0];
                                                    if (!file) return;
                                                    try {
                                                        // Upload to server so URL is permanent (fixes image "backtracking")
                                                        const serverUrl =
                                                            await uploadImageFile(
                                                                file
                                                            );
                                                        setDisasterForm(
                                                            (prev) => ({
                                                                ...prev,
                                                                imageUrl:
                                                                    serverUrl,
                                                            })
                                                        );
                                                        setImageRefreshToken(
                                                            Date.now()
                                                        );
                                                    } catch (err: any) {
                                                        setError(
                                                            err?.message ||
                                                                "Upload failed"
                                                        );
                                                    }
                                                    e.target.value = "";
                                                }}
                                            />
                                        </label>
                                        {disasterForm.imageUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDisasterForm(
                                                        (prev) => ({
                                                            ...prev,
                                                            imageUrl: "",
                                                        })
                                                    );
                                                    setImageRefreshToken(
                                                        Date.now()
                                                    );
                                                }}
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: 12,
                                                    border: "1px solid rgba(248,113,113,0.4)",
                                                    background:
                                                        "rgba(239,68,68,0.15)",
                                                    color: "#fca5a5",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Clear image
                                            </button>
                                        ) : null}
                                    </div>

                                    <small className="file-name">
                                        Upload a file (saved with the disaster)
                                        or paste Unsplash / Imgur / Google Drive
                                        link. Drive links are auto-converted.
                                    </small>

                                    <div
                                        className="image-preview"
                                        style={{
                                            marginTop: 14,
                                            borderRadius: 16,
                                            overflow: "hidden",
                                            border: "1px solid rgba(96,165,250,0.3)",
                                            background: "rgba(0,0,0,0.35)",
                                            minHeight: 160,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {disasterForm.imageUrl &&
                                        disasterForm.imageUrl.trim() !==
                                            "" ? (
                                            <img
                                                key={`preview-${imageRefreshToken}-${(disasterForm.imageUrl || "").slice(0, 40)}`}
                                                src={resolveDisasterImage(
                                                    {
                                                        imageUrl:
                                                            disasterForm.imageUrl,
                                                        type: disasterForm.type,
                                                        title: disasterForm.title,
                                                        id: editingDisasterId,
                                                    },
                                                    imageRefreshToken
                                                )}
                                                alt="Preview before save"
                                                style={{
                                                    width: "100%",
                                                    maxHeight: 260,
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                                onError={(e) => {
                                                    const img =
                                                        e.currentTarget;
                                                    img.style.opacity = "0.3";
                                                }}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    color: "#94a3b8",
                                                    fontSize: 13,
                                                    padding: 24,
                                                    textAlign: "center",
                                                }}
                                            >
                                                Live preview appears here before
                                                you save / update
                                            </span>
                                        )}
                                    </div>

                                </div>

                            </div>


                            
                                <div className="form-field full" style={{ marginTop: 18 }}>
                                    <label>Extra details (shown when user opens the post)</label>
                                    <textarea
                                        value={extraDetailsForm}
                                        onChange={(e) => setExtraDetailsForm(e.target.value)}
                                        rows={4}
                                        placeholder="Safety tips, evacuation routes, contacts, updates…"
                                        style={{ width: "100%", padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(52,211,153,0.3)", color: "#ecfdf5", fontFamily: "inherit" }}
                                    />
                                </div>
                                <div className="form-field full">
                                    <label>Extra gallery images (slide show on post click)</label>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                                        <label style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(52,211,153,0.4)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                                            Add image file
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: "none" }}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    try {
                                                        const url = await uploadImageFile(file);
                                                        setGalleryForm((g) => [...g, url]);
                                                    } catch (err: any) {
                                                        setError(err?.message || "Upload failed");
                                                    }
                                                    e.target.value = "";
                                                }}
                                            />
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Or paste image URL and press Add"
                                            id="gallery-url-input"
                                            style={{ flex: 1, minWidth: 160, padding: 10, borderRadius: 10, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(0,0,0,0.35)", color: "#ecfdf5" }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const el = e.currentTarget;
                                                    const v = normalizeImageUrl(el.value) || el.value.trim();
                                                    if (v) {
                                                        setGalleryForm((g) => [...g, v]);
                                                        el.value = "";
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById("gallery-url-input") as HTMLInputElement | null;
                                                if (!el) return;
                                                const v = normalizeImageUrl(el.value) || el.value.trim();
                                                if (v) {
                                                    setGalleryForm((g) => [...g, v]);
                                                    el.value = "";
                                                }
                                            }}
                                            style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {galleryForm.map((url, idx) => (
                                            <div key={idx} style={{ position: "relative", width: 88, height: 66 }}>
                                                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setGalleryForm((g) => g.filter((_, i) => i !== idx))}
                                                    style={{ position: "absolute", top: 2, right: 2, border: "none", borderRadius: 6, background: "rgba(0,0,0,0.7)", color: "#fff", cursor: "pointer", fontSize: 11, padding: "2px 6px" }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

<div className="form-footer">

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={
                                        loading
                                    }
                                >
                                    <Icon
                                        name={
                                            loading
                                                ? "refresh"
                                                : "plus"
                                        }
                                        size={18}
                                    />

                                    {loading
                                        ? "Saving..."
                                        : editingDisasterId
                                        ? "Update Disaster"
                                        : "Publish Disaster"}

                                </button>


                                {editingDisasterId && (

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={() => {

                                            setEditingDisasterId(
                                                null
                                            );

                                            setDisasterForm(
                                                emptyDisaster
                                            );
                                        }}
                                    >
                                        Cancel
                                    </button>

                                )}

                            </div>

                        </form>

                    </section>


                    {/* =================================================
                       VIDEOS + NDMA CONTENT (admin managed)
                    ================================================= */}

                    <section
                        className="section-block"
                        id="videos"
                    >
                        <div className="section-header">
                            <div>
                                <span className="section-eyebrow">
                                    PUBLIC AWARENESS · ADMIN
                                </span>
                                <h2>
                                    Videos, What&apos;s New, Guidelines &amp; Helplines
                                </h2>
                                <p>
                                    Add YouTube videos and NDMA-style portal content.
                                    Changes appear instantly on the user dashboard.
                                </p>
                            </div>
                        </div>

                        {contentMsg && (
                            <div className="content-flash">{contentMsg}</div>
                        )}

                        {/* --- Add YouTube video --- */}
                        <div className="content-admin-card">
                            <h3>Add awareness YouTube video</h3>
                            <p className="content-hint">
                                Paste a full YouTube URL or 11-character video ID. It will show on the user portal Videos section.
                            </p>
                            <form
                                className="content-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const ytId = parseYoutubeId(videoForm.youtubeUrl);
                                    if (!ytId) {
                                        setContentMsg("Invalid YouTube URL or ID");
                                        return;
                                    }
                                    if (!videoForm.title.trim()) {
                                        setContentMsg("Title is required");
                                        return;
                                    }
                                    addVideo({
                                        youtubeId: ytId,
                                        title: videoForm.title.trim(),
                                        description: videoForm.description.trim(),
                                    });
                                    setVideosList(getVideos());
                                    setVideoForm({ youtubeUrl: "", title: "", description: "" });
                                    setContentMsg("Video added — visible to users now");
                                    setTimeout(() => setContentMsg(""), 3000);
                                }}
                            >
                                <input
                                    placeholder="YouTube URL or video ID"
                                    value={videoForm.youtubeUrl}
                                    onChange={(e) =>
                                        setVideoForm((f) => ({
                                            ...f,
                                            youtubeUrl: e.target.value,
                                        }))
                                    }
                                />
                                <input
                                    placeholder="Title"
                                    value={videoForm.title}
                                    onChange={(e) =>
                                        setVideoForm((f) => ({
                                            ...f,
                                            title: e.target.value,
                                        }))
                                    }
                                />
                                <input
                                    placeholder="Short description"
                                    value={videoForm.description}
                                    onChange={(e) =>
                                        setVideoForm((f) => ({
                                            ...f,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                                <button type="submit" className="primary-button">
                                    Publish video
                                </button>
                            </form>
                        </div>

                        <div className="admin-videos-grid">
                            {videos.map((v) => (
                                <article key={v.id} className="admin-video-card">
                                    <div className="admin-video-embed">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${v.youtubeId}`}
                                            title={v.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="admin-video-meta">
                                        <h3>{v.title}</h3>
                                        <p>{v.description}</p>
                                        <button
                                            type="button"
                                            className="content-delete-btn"
                                            onClick={() => {
                                                deleteVideo(v.id);
                                                setVideosList(getVideos());
                                                setContentMsg("Video removed");
                                                setTimeout(() => setContentMsg(""), 2500);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* --- What's New --- */}
                        <div className="content-admin-card" style={{ marginTop: 28 }}>
                            <h3>What&apos;s New (announcements)</h3>
                            <form
                                className="content-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!wnForm.title.trim()) return;
                                    addWhatsNew({
                                        title: wnForm.title.trim(),
                                        date: wnForm.date || new Date().toISOString().slice(0, 10),
                                        summary: wnForm.summary.trim(),
                                        link: wnForm.link.trim() || undefined,
                                    });
                                    setWhatsNewList(getWhatsNew());
                                    setWnForm({ title: "", date: "", summary: "", link: "" });
                                    setContentMsg("Announcement published");
                                    setTimeout(() => setContentMsg(""), 2500);
                                }}
                            >
                                <input
                                    placeholder="Title"
                                    value={wnForm.title}
                                    onChange={(e) =>
                                        setWnForm((f) => ({ ...f, title: e.target.value }))
                                    }
                                />
                                <input
                                    type="date"
                                    value={wnForm.date}
                                    onChange={(e) =>
                                        setWnForm((f) => ({ ...f, date: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Summary"
                                    value={wnForm.summary}
                                    onChange={(e) =>
                                        setWnForm((f) => ({ ...f, summary: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Optional link / download URL"
                                    value={wnForm.link}
                                    onChange={(e) =>
                                        setWnForm((f) => ({ ...f, link: e.target.value }))
                                    }
                                />
                                <button type="submit" className="primary-button">
                                    Add announcement
                                </button>
                            </form>
                            <ul className="content-manage-list">
                                {whatsNewList.map((item) => (
                                    <li key={item.id}>
                                        <span>
                                            <strong>{item.title}</strong> · {item.date}
                                        </span>
                                        <button
                                            type="button"
                                            className="content-delete-btn"
                                            onClick={() => {
                                                deleteWhatsNew(item.id);
                                                setWhatsNewList(getWhatsNew());
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* --- Guidelines --- */}
                        <div className="content-admin-card" style={{ marginTop: 20 }}>
                            <h3>Guidelines catalogue</h3>
                            <form
                                className="content-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!glForm.title.trim()) return;
                                    addGuideline({
                                        title: glForm.title.trim(),
                                        releaseDate: glForm.releaseDate.trim() || "—",
                                        category: glForm.category.trim() || "General",
                                    });
                                    setGuidelinesList(getGuidelines());
                                    setGlForm({ title: "", releaseDate: "", category: "" });
                                    setContentMsg("Guideline added");
                                    setTimeout(() => setContentMsg(""), 2500);
                                }}
                            >
                                <input
                                    placeholder="Guideline title"
                                    value={glForm.title}
                                    onChange={(e) =>
                                        setGlForm((f) => ({ ...f, title: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Category (e.g. Heat Wave)"
                                    value={glForm.category}
                                    onChange={(e) =>
                                        setGlForm((f) => ({ ...f, category: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Release date text"
                                    value={glForm.releaseDate}
                                    onChange={(e) =>
                                        setGlForm((f) => ({
                                            ...f,
                                            releaseDate: e.target.value,
                                        }))
                                    }
                                />
                                <button type="submit" className="primary-button">
                                    Add guideline
                                </button>
                            </form>
                            <ul className="content-manage-list">
                                {guidelinesList.map((g) => (
                                    <li key={g.id}>
                                        <span>
                                            <strong>{g.title}</strong> · {g.category} ·{" "}
                                            {g.releaseDate}
                                        </span>
                                        <button
                                            type="button"
                                            className="content-delete-btn"
                                            onClick={() => {
                                                deleteGuideline(g.id);
                                                setGuidelinesList(getGuidelines());
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* --- Helplines --- */}
                        <div className="content-admin-card" style={{ marginTop: 20 }}>
                            <h3>Emergency helplines</h3>
                            <form
                                className="content-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!hlForm.name.trim() || !hlForm.number.trim()) return;
                                    addHelpline({
                                        name: hlForm.name.trim(),
                                        number: hlForm.number.trim(),
                                        note: hlForm.note.trim() || undefined,
                                    });
                                    setHelplinesList(getHelplines());
                                    setHlForm({ name: "", number: "", note: "" });
                                    setContentMsg("Helpline added");
                                    setTimeout(() => setContentMsg(""), 2500);
                                }}
                            >
                                <input
                                    placeholder="Name (e.g. NDMA Control Room)"
                                    value={hlForm.name}
                                    onChange={(e) =>
                                        setHlForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Number"
                                    value={hlForm.number}
                                    onChange={(e) =>
                                        setHlForm((f) => ({ ...f, number: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Note (optional)"
                                    value={hlForm.note}
                                    onChange={(e) =>
                                        setHlForm((f) => ({ ...f, note: e.target.value }))
                                    }
                                />
                                <button type="submit" className="primary-button">
                                    Add helpline
                                </button>
                            </form>
                            <ul className="content-manage-list">
                                {helplinesList.map((h) => (
                                    <li key={h.id}>
                                        <span>
                                            <strong>{h.name}</strong> · {h.number}
                                            {h.note ? ` · ${h.note}` : ""}
                                        </span>
                                        <button
                                            type="button"
                                            className="content-delete-btn"
                                            onClick={() => {
                                                deleteHelpline(h.id);
                                                setHelplinesList(getHelplines());
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>


                    {/* =================================================
                       MAP
                    ================================================= */}

                    <section
                        className="section-block"
                        id="map"
                    >

                        <div className="section-header">

                            <div>

                                <span className="section-eyebrow">
                                    LOCATION INTELLIGENCE
                                </span>

                                <h2>
                                    Live Disaster Map
                                </h2>

                                <p>
                                    Geographic view of
                                    reported disaster
                                    locations.
                                </p>

                            </div>

                            <span className="live-pill">
                                <i />
                                LIVE
                            </span>

                        </div>


                        <div className="map-card">

                            <DisasterMap
                                disasters={
                                    disasters
                                }
                            />

                        </div>

                    </section>


                    {/* =================================================
                       CLIMATE
                    ================================================= */}

                    <section
                        className="section-block"
                        id="climate"
                    >

                        <div className="section-header">

                            <div>

                                <span className="section-eyebrow">
                                    ENVIRONMENT MONITORING
                                </span>

                                <h2>
                                    Climate & Weather
                                </h2>

                                <p>
                                    Current environmental
                                    conditions for the
                                    monitored region.
                                </p>

                            </div>

                            <span className="location-pill">
                                <Icon
                                    name="location"
                                    size={14}
                                />

                                Guntur
                            </span>

                        </div>


                        <div className="climate-main-card">

                            <div className="climate-current">

                                <div className="climate-weather-icon">
                                    <Icon
                                        name="weather"
                                        size={42}
                                    />
                                </div>

                                <div>

                                    <span>
                                        CURRENT CONDITION
                                    </span>

                                    <strong>
                                        {
                                            climate?.condition ||
                                            "Loading..."
                                        }
                                    </strong>

                                    <small>
                                        {
                                            climate?.location ||
                                            "Guntur"
                                        }
                                    </small>

                                </div>

                            </div>


                            <div className="climate-temperature">

                                <strong>
                                    {
                                        climate?.temperature ??
                                        "--"
                                    }°
                                </strong>

                                <span>
                                    Celsius
                                </span>

                            </div>

                        </div>


                        <div className="climate-grid">

                            <div className="climate-card">

                                <div className="climate-icon temperature">
                                    <Icon
                                        name="temperature"
                                        size={23}
                                    />
                                </div>

                                <span>
                                    Temperature
                                </span>

                                <strong>
                                    {
                                        climate?.temperature ??
                                        "--"
                                    }°C
                                </strong>

                            </div>


                            <div className="climate-card">

                                <div className="climate-icon water">
                                    <Icon
                                        name="water"
                                        size={23}
                                    />
                                </div>

                                <span>
                                    Humidity
                                </span>

                                <strong>
                                    {
                                        climate?.humidity ??
                                        "--"
                                    }%
                                </strong>

                            </div>


                            <div className="climate-card">

                                <div className="climate-icon wind">
                                    <Icon
                                        name="wind"
                                        size={23}
                                    />
                                </div>

                                <span>
                                    Wind Speed
                                </span>

                                <strong>
                                    {
                                        climate?.windSpeed ??
                                        "--"
                                    } km/h
                                </strong>

                            </div>


                            <div className="climate-card">

                                <div className="climate-icon rain">
                                    <Icon
                                        name="rain"
                                        size={23}
                                    />
                                </div>

                                <span>
                                    Rainfall
                                </span>

                                <strong>
                                    {
                                        climate?.rainfall ??
                                        "--"
                                    } mm
                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                       VOLUNTEERS
                    ================================================= */}

                    <section
                        className="section-block"
                        id="volunteers"
                    >

                        <div className="section-header">

                            <div>

                                <span className="section-eyebrow">
                                    HUMAN RESOURCES
                                </span>

                                <h2>
                                    Volunteers
                                </h2>

                                <p>
                                    Manage emergency
                                    volunteers and
                                    deployment readiness.
                                </p>

                            </div>

                        </div>


                        <form
                            className="form-card compact-form"
                            onSubmit={
                                saveVolunteer
                            }
                        >

                            <div className="form-grid">

                                <div className="form-field">
                                    <label>
                                        Name
                                    </label>

                                    <input
                                        name="name"
                                        value={
                                            volunteerForm.name
                                        }
                                        onChange={
                                            handleVolunteerChange
                                        }
                                        placeholder="Volunteer name"
                                        required
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Mobile
                                    </label>

                                    <input
                                        name="mobile"
                                        value={
                                            volunteerForm.mobile
                                        }
                                        onChange={
                                            handleVolunteerChange
                                        }
                                        placeholder="Mobile number"
                                        required
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            volunteerForm.email
                                        }
                                        onChange={
                                            handleVolunteerChange
                                        }
                                        placeholder="Email"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Skill
                                    </label>

                                    <input
                                        name="skill"
                                        value={
                                            volunteerForm.skill
                                        }
                                        onChange={
                                            handleVolunteerChange
                                        }
                                        placeholder="Medical / Rescue / Logistics"
                                        required
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Location
                                    </label>

                                    <input
                                        name="location"
                                        value={
                                            volunteerForm.location
                                        }
                                        onChange={
                                            handleVolunteerChange
                                        }
                                        placeholder="Location"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Availability
                                    </label>

                                    <select
                                        name="availability"
                                        value={
                                            volunteerForm.availability
                                        }
                                        onChange={
                                            handleVolunteerChange
                                        }
                                    >
                                        <option value="AVAILABLE">
                                            Available
                                        </option>

                                        <option value="BUSY">
                                            Busy
                                        </option>

                                        <option value="UNAVAILABLE">
                                            Unavailable
                                        </option>
                                    </select>
                                </div>

                            </div>


                            <div className="form-footer">

                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <Icon
                                        name="plus"
                                        size={18}
                                    />

                                    {editingVolunteerId
                                        ? "Update Volunteer"
                                        : "Add Volunteer"}
                                </button>

                            </div>

                        </form>


                        <div className="table-card">

                            <div className="table-scroll">

                                <table>

                                    <thead>

                                        <tr>
                                            <th>
                                                Volunteer
                                            </th>

                                            <th>
                                                Skill
                                            </th>

                                            <th>
                                                Location
                                            </th>

                                            <th>
                                                Availability
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Action
                                            </th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {volunteers.map(
                                            (volunteer) => (

                                                <tr
                                                    key={
                                                        volunteer.id
                                                    }
                                                >

                                                    <td>

                                                        <div className="person-cell">

                                                            <div className="person-avatar">
                                                                {
                                                                    volunteer.name
                                                                        ?.charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()
                                                                }
                                                            </div>

                                                            <div>

                                                                <strong>
                                                                    {
                                                                        volunteer.name
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {
                                                                        volunteer.mobile
                                                                    }
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td>
                                                        {
                                                            volunteer.skill
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            volunteer.location
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`table-badge ${volunteer.availability?.toLowerCase()}`}
                                                        >
                                                            {
                                                                volunteer.availability
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            volunteer.status
                                                        }
                                                    </td>

                                                    <td>

                                                        <div className="table-actions">

                                                            <button
                                                                onClick={() => {

                                                                    setVolunteerForm(
                                                                        volunteer
                                                                    );

                                                                    setEditingVolunteerId(
                                                                        volunteer.id ??
                                                                            null
                                                                    );

                                                                }}
                                                            >
                                                                <Icon
                                                                    name="edit"
                                                                    size={15}
                                                                />
                                                            </button>

                                                            <button
                                                                className="danger"
                                                                onClick={() =>
                                                                    deleteVolunteer(
                                                                        volunteer.id
                                                                    )
                                                                }
                                                            >
                                                                <Icon
                                                                    name="trash"
                                                                    size={15}
                                                                />
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                       RESOURCES
                    ================================================= */}

                    <section
                        className="section-block"
                        id="resources"
                    >

                        <div className="section-header">

                            <div>

                                <span className="section-eyebrow">
                                    SUPPLY MANAGEMENT
                                </span>

                                <h2>
                                    Emergency Resources
                                </h2>

                                <p>
                                    Track medical,
                                    rescue and relief
                                    supplies.
                                </p>

                            </div>

                        </div>


                        <form
                            className="form-card compact-form"
                            onSubmit={
                                saveResource
                            }
                        >

                            <div className="form-grid">

                                <div className="form-field">
                                    <label>
                                        Resource Name
                                    </label>

                                    <input
                                        name="name"
                                        value={
                                            resourceForm.name
                                        }
                                        onChange={
                                            handleResourceChange
                                        }
                                        placeholder="First Aid Kits"
                                        required
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Category
                                    </label>

                                    <select
                                        name="category"
                                        value={
                                            resourceForm.category
                                        }
                                        onChange={
                                            handleResourceChange
                                        }
                                    >
                                        <option value="">
                                            Select category
                                        </option>

                                        <option value="MEDICAL">
                                            Medical
                                        </option>

                                        <option value="FOOD">
                                            Food
                                        </option>

                                        <option value="WATER">
                                            Water
                                        </option>

                                        <option value="RESCUE">
                                            Rescue
                                        </option>

                                        <option value="SHELTER">
                                            Shelter
                                        </option>

                                        <option value="TRANSPORT">
                                            Transport
                                        </option>
                                    </select>
                                </div>


                                <div className="form-field">
                                    <label>
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        name="quantity"
                                        value={
                                            resourceForm.quantity
                                        }
                                        onChange={
                                            handleResourceChange
                                        }
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Location
                                    </label>

                                    <input
                                        name="location"
                                        value={
                                            resourceForm.location
                                        }
                                        onChange={
                                            handleResourceChange
                                        }
                                        placeholder="Relief Center"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            resourceForm.status
                                        }
                                        onChange={
                                            handleResourceChange
                                        }
                                    >
                                        <option value="AVAILABLE">
                                            Available
                                        </option>

                                        <option value="LOW">
                                            Low Stock
                                        </option>

                                        <option value="OUT_OF_STOCK">
                                            Out of Stock
                                        </option>
                                    </select>
                                </div>

                            </div>


                            <div className="form-footer">

                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <Icon
                                        name="plus"
                                        size={18}
                                    />

                                    {editingResourceId
                                        ? "Update Resource"
                                        : "Add Resource"}
                                </button>

                            </div>

                        </form>


                        <div className="resource-grid">

                            {resources.map(
                                (resource) => (

                                    <div
                                        className="resource-card"
                                        key={
                                            resource.id
                                        }
                                    >

                                        <div className="resource-icon">
                                            <Icon
                                                name="resource"
                                                size={24}
                                            />
                                        </div>

                                        <div className="resource-info">

                                            <span>
                                                {
                                                    resource.category
                                                }
                                            </span>

                                            <h3>
                                                {
                                                    resource.name
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    resource.location
                                                }
                                            </p>

                                        </div>

                                        <strong className="resource-quantity">
                                            {
                                                resource.quantity
                                            }
                                        </strong>

                                        <div className="resource-actions">

                                            <button
                                                onClick={() => {

                                                    setResourceForm(
                                                        resource
                                                    );

                                                    setEditingResourceId(
                                                        resource.id ??
                                                            null
                                                    );

                                                }}
                                            >
                                                <Icon
                                                    name="edit"
                                                    size={15}
                                                />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    deleteResource(
                                                        resource.id
                                                    )
                                                }
                                            >
                                                <Icon
                                                    name="trash"
                                                    size={15}
                                                />
                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    </section>


                    {/* =================================================
                       FUNDS (donations via Razorpay)
                    ================================================= */}

                    <section
                        className="section-block"
                        id="funds"
                    >
                        <div className="section-header">
                            <div>
                                <span className="section-eyebrow">
                                    DONATIONS
                                </span>
                                <h2>Funds Received</h2>
                                <p>View all payments made by users via Razorpay.</p>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    className="outline-button"
                                    onClick={exportFundsCsv}
                                    disabled={!funds.length}
                                >
                                    <Icon name="download" size={16} /> Export CSV
                                </button>
                                <button
                                    className="primary-button"
                                    onClick={async () => {
                                        try {
                                            setFundsLoading(true);
                                            const res = await api.get("/funds");
                                            setFunds(Array.isArray(res.data) ? res.data : []);
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            setFundsLoading(false);
                                        }
                                    }}
                                >
                                    <Icon name="refresh" size={16} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                gap: 12,
                                marginBottom: 16,
                            }}
                        >
                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 14,
                                    background: "rgba(16,185,129,0.12)",
                                    border: "1px solid rgba(52,211,153,0.3)",
                                }}
                            >
                                <small style={{ color: "#94a3b8" }}>Total PAID</small>
                                <strong style={{ display: "block", fontSize: 20, color: "#6ee7b7" }}>
                                    ₹{fundsPaidTotal.toFixed(2)}
                                </strong>
                            </div>
                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 14,
                                    background: "rgba(59,130,246,0.12)",
                                    border: "1px solid rgba(96,165,250,0.3)",
                                }}
                            >
                                <small style={{ color: "#94a3b8" }}>Transactions</small>
                                <strong style={{ display: "block", fontSize: 20 }}>{funds.length}</strong>
                            </div>
                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 14,
                                    background: "rgba(251,191,36,0.1)",
                                    border: "1px solid rgba(251,191,36,0.3)",
                                }}
                            >
                                <small style={{ color: "#94a3b8" }}>Pending reports</small>
                                <strong style={{ display: "block", fontSize: 20, color: "#fbbf24" }}>
                                    {pendingReports.length}
                                </strong>
                            </div>
                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 14,
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(248,113,113,0.3)",
                                }}
                            >
                                <small style={{ color: "#94a3b8" }}>Low stock resources</small>
                                <strong style={{ display: "block", fontSize: 20, color: "#fca5a5" }}>
                                    {lowStockResources.length}
                                </strong>
                            </div>
                        </div>

                        {fundsLoading ? (
                            <p>Loading funds…</p>
                        ) : funds.length === 0 ? (
                            <div className="empty-state">
                                <p>No funds recorded yet.</p>
                            </div>
                        ) : (
                            <div className="table-wrap" style={{ overflowX: "auto" }}>
                                <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                                            <th style={{ textAlign: "left", padding: 8 }}>Donor</th>
                                            <th style={{ textAlign: "left", padding: 8 }}>Email</th>
                                            <th style={{ textAlign: "left", padding: 8 }}>Mobile</th>
                                            <th style={{ textAlign: "left", padding: 8 }}>Amount</th>
                                            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                                            <th style={{ textAlign: "left", padding: 8 }}>Payment ID</th>
                                            <th style={{ textAlign: "left", padding: 8 }}>Paid At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {funds.map((f: any) => (
                                            <tr key={f.id}>
                                                <td style={{ padding: 8 }}>{f.id}</td>
                                                <td style={{ padding: 8 }}>{f.donorName}</td>
                                                <td style={{ padding: 8 }}>{f.donorEmail}</td>
                                                <td style={{ padding: 8 }}>{f.donorMobile}</td>
                                                <td style={{ padding: 8 }}>₹{Number(f.amount || 0).toFixed(2)}</td>
                                                <td style={{ padding: 8 }}>
                                                    <span style={{
                                                        color: f.status === "PAID" ? "#16a34a" : "#ca8a04",
                                                        fontWeight: 600
                                                    }}>{f.status}</span>
                                                </td>
                                                <td style={{ padding: 8, fontSize: 12 }}>{f.razorpayPaymentId || "—"}</td>
                                                <td style={{ padding: 8, fontSize: 12 }}>
                                                    {f.paidAt ? new Date(f.paidAt).toLocaleString("en-IN") : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p style={{ marginTop: 12, opacity: 0.8 }}>
                                    Total received (PAID): ₹
                                    {funds
                                        .filter((f: any) => f.status === "PAID")
                                        .reduce((s: number, f: any) => s + Number(f.amount || 0), 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                        )}
                    </section>


                    {/* =================================================
                       NOTIFICATIONS
                    ================================================= */}

                    <section
                        className="section-block"
                        id="notifications"
                    >

                        <div className="section-header">

                            <div>

                                <span className="section-eyebrow">
                                    EMERGENCY COMMUNICATION
                                </span>

                                <h2>
                                    Notifications & Alerts
                                </h2>

                                <p>
                                    Publish important
                                    emergency information
                                    for users.
                                </p>

                            </div>

                        </div>


                        <form
                            className="form-card"
                            onSubmit={
                                saveAlert
                            }
                        >

                            <div className="form-grid">

                                <div className="form-field">

                                    <label>
                                        Alert Title
                                    </label>

                                    <input
                                        name="title"
                                        value={
                                            alertForm.title
                                        }
                                        onChange={
                                            handleAlertChange
                                        }
                                        placeholder="Emergency Warning"
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Severity
                                    </label>

                                    <select
                                        name="severity"
                                        value={
                                            alertForm.severity
                                        }
                                        onChange={
                                            handleAlertChange
                                        }
                                    >

                                        <option value="LOW">
                                            Low
                                        </option>

                                        <option value="MEDIUM">
                                            Medium
                                        </option>

                                        <option value="HIGH">
                                            High
                                        </option>

                                        <option value="CRITICAL">
                                            Critical
                                        </option>

                                    </select>

                                </div>


                                <div className="form-field full">

                                    <label>
                                        Message
                                    </label>

                                    <textarea
                                        name="message"
                                        value={
                                            alertForm.message
                                        }
                                        onChange={
                                            handleAlertChange
                                        }
                                        rows={4}
                                        placeholder="Enter emergency notification..."
                                        required
                                    />

                                </div>


                                <div className="form-field full">

                                    <label>
                                        Location
                                    </label>

                                    <input
                                        name="location"
                                        value={
                                            alertForm.location
                                        }
                                        onChange={
                                            handleAlertChange
                                        }
                                        placeholder="Affected location"
                                    />

                                </div>

                            </div>


                            <div className="form-footer">

                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <Icon
                                        name="notification"
                                        size={18}
                                    />

                                    Publish Notification
                                </button>

                            </div>

                        </form>


                        <div className="alert-list">

                            {alerts.map(
                                (alert) => (

                                    <div
                                        className={`alert-card ${alert.severity?.toLowerCase()}`}
                                        key={
                                            alert.id
                                        }
                                    >

                                        <div className="alert-icon">

                                            <Icon
                                                name="notification"
                                                size={21}
                                            />

                                        </div>


                                        <div className="alert-content">

                                            <div>

                                                <span>
                                                    {
                                                        alert.severity
                                                    }
                                                </span>

                                                {alert.active && (
                                                    <b>
                                                        ACTIVE
                                                    </b>
                                                )}

                                            </div>

                                            <h3>
                                                {
                                                    alert.title
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    alert.message
                                                }
                                            </p>

                                            <small>
                                                {
                                                    alert.location
                                                }
                                            </small>

                                        </div>


                                        <button
                                            className="alert-delete"
                                            onClick={() =>
                                                deleteAlert(
                                                    alert.id
                                                )
                                            }
                                        >
                                            <Icon
                                                name="trash"
                                                size={17}
                                            />
                                        </button>

                                    </div>

                                )
                            )}

                        </div>

                    </section>


                    {/* =================================================
                       FOOTER
                    ================================================= */}

                    <footer className="admin-footer">

                        <div>
                            <strong>
                                DISASTRA
                            </strong>

                            <span>
                                Disaster Management
                                & Emergency Response
                                System
                            </span>
                        </div>

                        <span>
                            © 2026 DISASTRA
                        </span>

                    </footer>

                </div>

            </main>

        </div>
    );
}

export default AdminDashboard;
