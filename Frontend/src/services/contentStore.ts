/**
 * Shared content store for Disastra (NDMA-style portal content).
 * Videos, What's New, Guidelines, Do's & Don'ts, Helplines —
 * managed by admin, shown to users. Persisted in localStorage.
 */

export interface AwarenessVideo {
    id: string;
    youtubeId: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface WhatsNewItem {
    id: string;
    title: string;
    date: string;
    summary: string;
    link?: string;
}

export interface GuidelineItem {
    id: string;
    title: string;
    releaseDate: string;
    category: string;
}

export interface DosDontsItem {
    id: string;
    hazard: string;
    dos: string[];
    donts: string[];
}

export interface HelplineItem {
    id: string;
    name: string;
    number: string;
    note?: string;
}

const KEYS = {
    videos: "disastra_videos",
    whatsNew: "disastra_whats_new",
    guidelines: "disastra_guidelines",
    dosDonts: "disastra_dos_donts",
    helplines: "disastra_helplines",
} as const;

const DEFAULT_VIDEOS: AwarenessVideo[] = [
    {
        id: "v1",
        youtubeId: "_PlTOAvtLVA",
        title: "Disaster Ready Schools – NDMA",
        description: "School safety & evacuation drills",
        createdAt: new Date().toISOString(),
    },
    {
        id: "v2",
        youtubeId: "JRYalxEHsT0",
        title: "GLOF – Glacial Lake Outburst Flood",
        description: "Understanding risk & preparedness",
        createdAt: new Date().toISOString(),
    },
    {
        id: "v3",
        youtubeId: "ffeWYFxGUfE",
        title: "Flood & disaster safety (आपदा का सामना)",
        description: "How to stay safe during floods",
        createdAt: new Date().toISOString(),
    },
    {
        id: "v4",
        youtubeId: "ooIhMNHi0fo",
        title: "Disaster Resilient Communities",
        description: "Monsoon preparedness for citizens",
        createdAt: new Date().toISOString(),
    },
    {
        id: "v5",
        youtubeId: "Eui6yvnm8ec",
        title: "Crowd management safety",
        description: "Stay safe at large events",
        createdAt: new Date().toISOString(),
    },
    {
        id: "v6",
        youtubeId: "rhoVUCSG6mQ",
        title: "Disaster Ready School Campaign",
        description: "Launch across Delhi NCT districts",
        createdAt: new Date().toISOString(),
    },
];

const DEFAULT_WHATS_NEW: WhatsNewItem[] = [
    {
        id: "wn1",
        title: "Stakeholder Consultation Workshop on National Guidelines for Tunnel Safety",
        date: "2026-09-15",
        summary: "Workshop scheduled 17–18 September 2026 at IIPA, New Delhi.",
    },
    {
        id: "wn2",
        title: "Annual Calendar 2026-27 for Mock Exercises",
        date: "2026-05-08",
        summary: "Calendar for mock exercises across all States/UTs and Districts.",
    },
    {
        id: "wn3",
        title: "National Guidelines on Animal-inclusive Disaster Risk Reduction (AiDRR)",
        date: "2026-05-02",
        summary: "New guidelines for including animals in disaster risk reduction planning.",
    },
];

const DEFAULT_GUIDELINES: GuidelineItem[] = [
    { id: "g1", title: "National Guidelines on Animal-inclusive Disaster Risk Reduction (AiDRR)", releaseDate: "Apr 2026", category: "Policy" },
    { id: "g2", title: "Guidelines on Comprehensive Disaster Victim Identification and Management", releaseDate: "Jan 2026", category: "Response" },
    { id: "g3", title: "National Guidelines for Cooling Centers", releaseDate: "Nov 2025", category: "Heat Wave" },
    { id: "g4", title: "National Guidelines on Community-Based Disaster Risk Reduction (CBDRR)", releaseDate: "Oct 2024", category: "Community" },
    { id: "g5", title: "Guidelines on Management of Glacial Lake Outburst Floods (GLOFs)", releaseDate: "Oct 2020", category: "GLOF" },
    { id: "g6", title: "Guidelines for Preparation of Action Plan – Prevention and Management of Heat Wave", releaseDate: "Oct 2019", category: "Heat Wave" },
    { id: "g7", title: "Landslide Risk Management Strategy", releaseDate: "Sept 2019", category: "Landslide" },
    { id: "g8", title: "Guidelines on School Safety Policy", releaseDate: "Feb 2016", category: "School Safety" },
];

const DEFAULT_DOS_DONTS: DosDontsItem[] = [
    {
        id: "dd1",
        hazard: "Earthquake",
        dos: [
            "Repair deep plaster cracks in ceilings and foundations; get expert advice if structural defects appear.",
            "Anchor overhead lighting fixtures to the ceiling.",
            "Follow BIS codes relevant to your area for building standards.",
            "Keep an emergency kit ready (water, food, torch, first-aid, documents).",
            "Practice Drop, Cover and Hold On with family.",
        ],
        donts: [
            "Do not run outdoors during shaking.",
            "Do not use elevators.",
            "Do not light a match or switch on electrical appliances if you smell gas.",
            "Do not stand near windows, mirrors or heavy furniture.",
        ],
    },
    {
        id: "dd2",
        hazard: "Flood",
        dos: [
            "Move to higher ground immediately when warned.",
            "Switch off electrical mains and gas.",
            "Keep documents and valuables in waterproof containers.",
            "Store drinking water and ready-to-eat food for at least a week.",
            "Follow official evacuation routes and shelters.",
        ],
        donts: [
            "Do not walk or drive through flood water.",
            "Do not touch electrical equipment if wet.",
            "Do not drink flood water.",
            "Do not ignore official warnings or evacuation orders.",
        ],
    },
    {
        id: "dd3",
        hazard: "Cyclone",
        dos: [
            "Ignore rumours; stay calm; follow official bulletins.",
            "Keep mobile phones charged; prefer SMS for communication.",
            "Secure the roof and loose outdoor objects.",
            "Prepare an emergency kit with essentials.",
            "Know the nearest safe shelter and route.",
        ],
        donts: [
            "Do not go outside during the calm eye of the storm.",
            "Do not stay in weak or unfinished structures.",
            "Do not leave sharp or loose objects that can become projectiles.",
            "Do not spread unverified information.",
        ],
    },
    {
        id: "dd4",
        hazard: "Heat Wave",
        dos: [
            "Drink water frequently, even if not thirsty; use ORS, lassi, lemon water.",
            "Wear light-coloured, loose cotton clothes; use umbrella/hat outdoors.",
            "Stay indoors during peak heat (12 noon–3 pm).",
            "Keep home cool with curtains and ventilation at night.",
            "Check on elderly, children and outdoor workers.",
        ],
        donts: [
            "Do not leave children or pets in parked vehicles.",
            "Avoid alcohol, tea, coffee and carbonated drinks that dehydrate.",
            "Avoid strenuous outdoor work in peak heat.",
            "Do not ignore symptoms of heat stroke — seek medical help immediately.",
        ],
    },
    {
        id: "dd5",
        hazard: "Landslide",
        dos: [
            "Plan travel in hilly areas using official weather advisories.",
            "Move away from landslide path or downstream valleys quickly.",
            "Listen for unusual sounds (trees cracking, boulders knocking).",
            "Evacuate if authorities advise.",
        ],
        donts: [
            "Do not build or stay in known vulnerable slopes.",
            "Do not cross landslide debris without clearance.",
            "Do not dig or cut toe of a slope without engineering advice.",
        ],
    },
];

const DEFAULT_HELPLINES: HelplineItem[] = [
    { id: "h1", name: "National Emergency Number", number: "112", note: "Police / Fire / Ambulance" },
    { id: "h2", name: "NDMA Control Room", number: "011-26701728", note: "24×7" },
    { id: "h3", name: "NDMA Office", number: "011-26701700", note: "Mon–Fri 9:30 AM–6:00 PM" },
    { id: "h4", name: "Disaster Management Helpline", number: "1078", note: "State / National disaster helpline" },
    { id: "h5", name: "Women Helpline", number: "1091", note: "" },
    { id: "h6", name: "Child Helpline", number: "1098", note: "" },
];

import { broadcastLive } from "../utils/liveSync";

function load<T>(key: string, fallback: T[]): T[] {
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw) as T[];
            if (Array.isArray(parsed) && parsed.length >= 0) return parsed;
        }
    } catch {
        /* */
    }
    return fallback;
}

function save<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("disastra-content", { detail: { key } }));
    broadcastLive("content");
}

export function getVideos(): AwarenessVideo[] {
    return load(KEYS.videos, DEFAULT_VIDEOS);
}

export function setVideos(list: AwarenessVideo[]) {
    save(KEYS.videos, list);
}

export function addVideo(v: Omit<AwarenessVideo, "id" | "createdAt">): AwarenessVideo {
    const list = getVideos();
    const item: AwarenessVideo = {
        ...v,
        id: `v_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    setVideos(list);
    return item;
}

export function updateVideo(id: string, patch: Partial<AwarenessVideo>) {
    const list = getVideos().map((x) => (x.id === id ? { ...x, ...patch } : x));
    setVideos(list);
}

export function deleteVideo(id: string) {
    setVideos(getVideos().filter((x) => x.id !== id));
}

export function getWhatsNew(): WhatsNewItem[] {
    return load(KEYS.whatsNew, DEFAULT_WHATS_NEW);
}

export function setWhatsNew(list: WhatsNewItem[]) {
    save(KEYS.whatsNew, list);
}

export function addWhatsNew(item: Omit<WhatsNewItem, "id">): WhatsNewItem {
    const list = getWhatsNew();
    const row: WhatsNewItem = { ...item, id: `wn_${Date.now()}` };
    list.unshift(row);
    setWhatsNew(list);
    return row;
}

export function deleteWhatsNew(id: string) {
    setWhatsNew(getWhatsNew().filter((x) => x.id !== id));
}

export function getGuidelines(): GuidelineItem[] {
    return load(KEYS.guidelines, DEFAULT_GUIDELINES);
}

export function setGuidelines(list: GuidelineItem[]) {
    save(KEYS.guidelines, list);
}

export function addGuideline(item: Omit<GuidelineItem, "id">): GuidelineItem {
    const list = getGuidelines();
    const row: GuidelineItem = { ...item, id: `g_${Date.now()}` };
    list.unshift(row);
    setGuidelines(list);
    return row;
}

export function deleteGuideline(id: string) {
    setGuidelines(getGuidelines().filter((x) => x.id !== id));
}

export function getDosDonts(): DosDontsItem[] {
    return load(KEYS.dosDonts, DEFAULT_DOS_DONTS);
}

export function setDosDonts(list: DosDontsItem[]) {
    save(KEYS.dosDonts, list);
}

export function getHelplines(): HelplineItem[] {
    return load(KEYS.helplines, DEFAULT_HELPLINES);
}

export function setHelplines(list: HelplineItem[]) {
    save(KEYS.helplines, list);
}

export function addHelpline(item: Omit<HelplineItem, "id">): HelplineItem {
    const list = getHelplines();
    const row: HelplineItem = { ...item, id: `h_${Date.now()}` };
    list.push(row);
    setHelplines(list);
    return row;
}

export function deleteHelpline(id: string) {
    setHelplines(getHelplines().filter((x) => x.id !== id));
}

/** Extract YouTube video ID from full URL or bare ID */
export function parseYoutubeId(input: string): string | null {
    const s = input.trim();
    if (!s) return null;
    if (/^[\w-]{11}$/.test(s)) return s;
    const m =
        s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/) ||
        s.match(/youtube\.com\/watch\?.*?v=([\w-]{11})/);
    return m ? m[1] : null;
}

export function subscribeContent(cb: () => void) {
    const handler = () => cb();
    window.addEventListener("disastra-content", handler);
    window.addEventListener("storage", handler);
    return () => {
        window.removeEventListener("disastra-content", handler);
        window.removeEventListener("storage", handler);
    };
}
