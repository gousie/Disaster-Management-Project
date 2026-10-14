import { useEffect, useRef, useState } from "react";

const KEY = "disastra_intro_seen_session";

type Star = { x: number; y: number; z: number; s: number };
type Node = { x: number; y: number; vx: number; vy: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

const BOOT_LINES = [
    "▶ Establishing quantum-secure uplink…",
    "▶ INSAT-3DR / GISAT telemetry lock",
    "▶ NDMA tactical radar mesh: 28 nodes",
    "▶ Hydrology + seismic fusion models",
    "▶ National command network handshake",
    "✓ All systems operational — access granted",
];

export default function IntroSplash() {
    const [show, setShow] = useState(false);
    const [progress, setProgress] = useState(0);
    const [phaseText, setPhaseText] = useState(BOOT_LINES[0]);
    const [isFading, setIsFading] = useState(false);
    const [clock, setClock] = useState(() =>
        new Date().toLocaleTimeString("en-IN", { hour12: false })
    );
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    const finish = () => {
        setIsFading(true);
        setTimeout(() => {
            setShow(false);
            try {
                sessionStorage.setItem(KEY, "1");
            } catch {
                /* */
            }
        }, 650);
    };

    useEffect(() => {
        try {
            if (sessionStorage.getItem(KEY) === "1") return;
        } catch {
            /* */
        }
        setShow(true);

        const startTime = Date.now();
        const duration = 4800;
        const clockTick = setInterval(() => {
            setClock(new Date().toLocaleTimeString("en-IN", { hour12: false }));
        }, 1000);

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(100, Math.round((elapsed / duration) * 100));
            setProgress(pct);
            const idx = Math.min(BOOT_LINES.length - 1, Math.floor(pct / 17));
            setPhaseText(BOOT_LINES[idx]);
            if (pct >= 100) {
                clearInterval(interval);
                finish();
            }
        }, 24);

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                clearInterval(interval);
                finish();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => {
            clearInterval(interval);
            clearInterval(clockTick);
            window.removeEventListener("keydown", handleEsc);
        };
    }, []);

    useEffect(() => {
        if (!show) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let angle = 0;
        let t = 0;
        const stars: Star[] = Array.from({ length: 220 }, () => ({
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            z: Math.random(),
            s: 0.4 + Math.random() * 1.6,
        }));
        const nodes: Node[] = Array.from({ length: 56 }, () => ({
            x: Math.random(),
            y: Math.random(),
            vx: (Math.random() - 0.5) * 0.00055,
            vy: (Math.random() - 0.5) * 0.00055,
        }));
        const meteors: Meteor[] = [];

        const draw = () => {
            const w = (canvas.width = canvas.offsetWidth);
            const h = (canvas.height = canvas.offsetHeight);
            ctx.clearRect(0, 0, w, h);

            const neb = ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.45, Math.max(w, h) * 0.7);
            neb.addColorStop(0, "rgba(14,165,233,0.16)");
            neb.addColorStop(0.35, "rgba(59,130,246,0.06)");
            neb.addColorStop(1, "transparent");
            ctx.fillStyle = neb;
            ctx.fillRect(0, 0, w, h);

            for (const st of stars) {
                st.z -= 0.0022;
                if (st.z <= 0) st.z = 1;
                const sx = (st.x / st.z) * w * 0.5 + w * 0.5;
                const sy = (st.y / st.z) * h * 0.5 + h * 0.5;
                const size = (1 - st.z) * st.s * 2.2;
                ctx.fillStyle = `rgba(186,230,253,${0.15 + (1 - st.z) * 0.7})`;
                ctx.fillRect(sx, sy, size, size);
            }

            if (Math.random() < 0.035) {
                meteors.push({
                    x: Math.random() * w,
                    y: -10,
                    vx: 6 + Math.random() * 8,
                    vy: 3 + Math.random() * 5,
                    life: 1,
                });
            }
            for (let i = meteors.length - 1; i >= 0; i--) {
                const m = meteors[i];
                m.x += m.vx;
                m.y += m.vy;
                m.life -= 0.018;
                ctx.strokeStyle = `rgba(125,211,252,${m.life})`;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x - m.vx * 4, m.y - m.vy * 4);
                ctx.stroke();
                if (m.life <= 0 || m.x > w + 40 || m.y > h + 40) meteors.splice(i, 1);
            }

            nodes.forEach((n) => {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > 1) n.vx *= -1;
                if (n.y < 0 || n.y > 1) n.vy *= -1;
            });
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const d = Math.hypot(dx, dy);
                    if (d < 0.14) {
                        ctx.strokeStyle = `rgba(56,189,248,${(0.14 - d) * 1.4})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
                        ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
                        ctx.stroke();
                    }
                }
            }
            nodes.forEach((n) => {
                ctx.beginPath();
                ctx.arc(n.x * w, n.y * h, 1.4, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(125,211,252,0.55)";
                ctx.fill();
            });

            const cx = w / 2;
            const cy = h / 2 + 8;
            const r = Math.min(w, h) * 0.26;

            for (let g = 0; g < 4; g++) {
                const grd = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * (1.55 + g * 0.28));
                grd.addColorStop(0, `rgba(14,165,233,${0.1 - g * 0.02})`);
                grd.addColorStop(1, "transparent");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(cx, cy, r * (1.55 + g * 0.28), 0, Math.PI * 2);
                ctx.fill();
            }

            const globeGrd = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.4, r * 0.08, cx, cy, r);
            globeGrd.addColorStop(0, "rgba(125,211,252,0.55)");
            globeGrd.addColorStop(0.28, "rgba(14,165,233,0.32)");
            globeGrd.addColorStop(0.62, "rgba(8,47,73,0.96)");
            globeGrd.addColorStop(1, "rgba(2,8,20,1)");
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = globeGrd;
            ctx.fill();

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
            ctx.clip();

            for (let gy = -r; gy < r; gy += 11) {
                for (let gx = -r; gx < r; gx += 13) {
                    const hx = cx + gx + ((Math.floor(gy / 11) % 2) * 6.5);
                    const hy = cy + gy;
                    if ((hx - cx) ** 2 + (hy - cy) ** 2 < r * r * 0.9) {
                        ctx.beginPath();
                        ctx.arc(hx, hy, 1.05, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(56,189,248,0.09)";
                        ctx.fill();
                    }
                }
            }

            for (let lat = -60; lat <= 60; lat += 20) {
                const yr = r * Math.sin((lat * Math.PI) / 180);
                const xr = r * Math.cos((lat * Math.PI) / 180);
                ctx.beginPath();
                ctx.ellipse(cx, cy + yr, xr, xr * 0.2, 0, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(125,211,252,0.28)";
                ctx.lineWidth = 0.85;
                ctx.stroke();
            }
            for (let i = 0; i < 14; i++) {
                const a = angle + (i * Math.PI) / 7;
                ctx.beginPath();
                ctx.ellipse(cx, cy, r * Math.abs(Math.cos(a)), r, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(56,189,248,${0.05 + 0.16 * Math.abs(Math.cos(a))})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(cx, cy);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, angle * 2.2, angle * 2.2 + 0.55);
            ctx.closePath();
            const sweep = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
            sweep.addColorStop(0, "rgba(56,189,248,0.22)");
            sweep.addColorStop(1, "transparent");
            ctx.fillStyle = sweep;
            ctx.fill();
            ctx.restore();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(125,211,252,0.75)";
            ctx.lineWidth = 2;
            ctx.stroke();
            const pulseR = r + 8 + Math.sin(t * 0.05) * 5;
            ctx.beginPath();
            ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(56,189,248,${0.12 + 0.12 * Math.sin(t * 0.05)})`;
            ctx.stroke();

            const hotspots = [
                { lat: 20, lon: 78 },
                { lat: 28, lon: 84 },
                { lat: 35, lon: 105 },
                { lat: -5, lon: 35 },
                { lat: 10, lon: -75 },
                { lat: 15, lon: 120 },
                { lat: -20, lon: 140 },
                { lat: 40, lon: -100 },
            ];
            const vis: { x: number; y: number }[] = [];
            hotspots.forEach((hs, idx) => {
                const lonA = (hs.lon * Math.PI) / 180 + angle * 0.9;
                const latR = (hs.lat * Math.PI) / 180;
                if (Math.cos(lonA) <= -0.12) return;
                const px = cx + r * Math.cos(latR) * Math.sin(lonA);
                const py = cy - r * Math.sin(latR);
                vis.push({ x: px, y: py });
                const pulse = 0.5 + 0.5 * Math.sin(t * 0.06 + idx);
                ctx.beginPath();
                ctx.arc(px, py, 5 + pulse * 12, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(249,115,22,${0.28 * pulse})`;
                ctx.lineWidth = 1.4;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(px, py, 2.6, 0, Math.PI * 2);
                ctx.fillStyle = idx % 2 ? "#ef4444" : "#f97316";
                ctx.shadowColor = "#f97316";
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            for (let i = 0; i < vis.length - 1; i++) {
                ctx.beginPath();
                ctx.moveTo(vis[i].x, vis[i].y);
                ctx.quadraticCurveTo(cx, cy - 28, vis[i + 1].x, vis[i + 1].y);
                ctx.strokeStyle = `rgba(56,189,248,${0.14 + 0.1 * Math.sin(t * 0.04 + i)})`;
                ctx.stroke();
            }

            const rings = [
                { b: 0.16, speed: 0.015, color: "rgba(56,189,248,0.55)", rr: r * 1.3 },
                { b: 0.2, speed: -0.011, color: "rgba(249,115,22,0.42)", rr: r * 1.52 },
                { b: 0.12, speed: 0.021, color: "rgba(16,185,129,0.4)", rr: r * 1.74 },
                { b: 0.18, speed: -0.017, color: "rgba(167,139,250,0.38)", rr: r * 1.96 },
            ];
            rings.forEach((ring, ri) => {
                const rot = angle * 0.4 + ri * 0.4;
                ctx.beginPath();
                ctx.ellipse(cx, cy, ring.rr, ring.rr * ring.b, rot, 0, Math.PI * 2);
                ctx.strokeStyle = ring.color;
                ctx.setLineDash([6, 10]);
                ctx.lineWidth = 1.15;
                ctx.stroke();
                ctx.setLineDash([]);
                const sa = angle * ring.speed * 28;
                const sx = cx + ring.rr * Math.cos(sa);
                const sy = cy + ring.rr * ring.b * Math.sin(sa);
                ctx.beginPath();
                ctx.arc(sx, sy, 3.6, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.shadowColor = ring.color;
                ctx.shadowBlur = 14;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            angle += 0.0075;
            t++;
            animFrameRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [show]);

    if (!show) return null;

    return (
        <div className={`disastra-intro-splash ${isFading ? "fade-out" : ""}`}>
            <canvas ref={canvasRef} className="intro-globe-canvas" />
            <div className="intro-hex-floor" />
            <div className="intro-grid-bg" />
            <div className="intro-scanline" />
            <div className="intro-vignette" />
            <div className="intro-corner tl" />
            <div className="intro-corner tr" />
            <div className="intro-corner bl" />
            <div className="intro-corner br" />

            <button type="button" className="intro-skip-btn" onClick={finish} title="Skip boot sequence">
                SKIP <span className="intro-esc-tag">ESC</span>
            </button>

            <div className="intro-top-hud">
                <div className="hud-left">
                    <span className="hud-dot live" />
                    <span className="hud-label">NDMA · NATIONAL COMMAND NETWORK</span>
                </div>
                <div className="hud-center">
                    <span className="hud-time">{clock}</span>
                </div>
                <div className="hud-right">
                    <span className="hud-code">SEC-AUTH // AES-256 DISASTRA v4.0</span>
                </div>
            </div>

            <div className="intro-side-hud left">
                {["SEISMIC", "HYDRO", "METEO", "TSUNAMI", "FIRE", "FLOOD"].map((s, i) => (
                    <div key={s} className="side-hud-row" style={{ animationDelay: `${i * 0.12}s` }}>
                        <span className="side-hud-label">{s}</span>
                        <div className="side-hud-bar">
                            <div className="side-hud-fill" style={{ width: `${48 + ((i * 17) % 40)}%` }} />
                        </div>
                        <span className={`side-hud-status ${i < 2 ? "alert" : "ok"}`}>{i < 2 ? "ALERT" : "NOMINAL"}</span>
                    </div>
                ))}
            </div>

            <div className="intro-side-hud right">
                {["UNIT-ALPHA", "UNIT-BRAVO", "UNIT-DELTA", "SAT-01", "GROUND-CTR"].map((s, i) => (
                    <div key={s} className="side-hud-row" style={{ animationDelay: `${i * 0.1}s` }}>
                        <span className="side-hud-label">{s}</span>
                        <span className={`side-hud-status ${i === 2 ? "warn" : "ok"}`}>{i === 2 ? "STANDBY" : "ONLINE"}</span>
                    </div>
                ))}
            </div>

            <div className="intro-main-content">
                <div className="intro-stat-row">
                    {[
                        { val: "28", label: "ACTIVE ZONES" },
                        { val: "1,247", label: "UNITS DEPLOYED" },
                        { val: "99.8%", label: "UPTIME" },
                        { val: "3", label: "CRITICAL ALERTS" },
                    ].map((s) => (
                        <div key={s.label} className="intro-stat-card">
                            <strong>{s.val}</strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="intro-brand-block">
                    <div className="intro-emblem">
                        <div className="emblem-ring outer" />
                        <div className="emblem-ring inner" />
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
                                stroke="url(#shieldGrad)"
                                strokeWidth="1.6"
                                fill="rgba(14,165,233,0.18)"
                            />
                            <path d="M9 12l2 2 4-4" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="shieldGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#00f2fe" />
                                    <stop offset="1" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="intro-title-group">
                        <span className="intro-ndma-tag">NATIONAL DISASTER MANAGEMENT AUTHORITY · INDIA</span>
                        <h1 className="intro-brand-title">DISASTRA</h1>
                        <span className="intro-tagline">STRONGER TOGETHER · SAFER FOREVER · NDMA CERTIFIED</span>
                    </div>
                </div>

                <div className="intro-boot-card">
                    <div className="boot-header">
                        <div className="boot-terminal-dot" />
                        <div className="boot-terminal-dot amber" />
                        <div className="boot-terminal-dot green" />
                        <span className="boot-title">CINEMATIC BOOT SEQUENCE</span>
                    </div>
                    <div className="boot-phase-text">{phaseText}</div>
                    <div className="intro-progress-track">
                        <div className="intro-progress-fill" style={{ width: `${progress}%` }}>
                            <div className="progress-shimmer" />
                        </div>
                    </div>
                    <div className="boot-footer">
                        <span className="boot-pct">{progress}%</span>
                        <div className="intro-freq-bars">
                            {Array.from({ length: 22 }).map((_, i) => (
                                <span
                                    key={i}
                                    className="freq-bar"
                                    style={{ animationDelay: `${(i % 7) * 0.08}s`, height: `${10 + ((i * 17) % 22)}px` }}
                                />
                            ))}
                        </div>
                        <span className="boot-version">BUILD 4.0.0 // NDMA-GOI</span>
                    </div>
                </div>
            </div>

            <div className="intro-bottom-bar">
                <span>◉ SATELLITE RELAY: ACTIVE</span>
                <span>◉ COMMAND MESH: ONLINE</span>
                <span>◉ ENCRYPTION: AES-256</span>
                <span>◉ BACKUP POWER: READY</span>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .disastra-intro-splash {
                    position: fixed; inset: 0; z-index: 999999;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    background: radial-gradient(ellipse 90% 70% at 50% 38%, #071428 0%, #020812 55%, #000 100%);
                    color: #f8fafc; overflow: hidden; font-family: Inter, system-ui, sans-serif;
                    transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
                }
                .disastra-intro-splash.fade-out { opacity: 0; transform: scale(1.06); pointer-events: none; }
                .intro-globe-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
                .intro-hex-floor {
                    position: absolute; left: -20%; right: -20%; bottom: -18%; height: 42%;
                    background-image:
                        linear-gradient(rgba(56,189,248,0.07) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(56,189,248,0.07) 1px, transparent 1px);
                    background-size: 42px 42px;
                    transform: perspective(420px) rotateX(62deg);
                    mask-image: linear-gradient(to top, black, transparent);
                    pointer-events: none; z-index: 1; animation: hexDrift 18s linear infinite;
                }
                @keyframes hexDrift { to { background-position: 42px 42px; } }
                .intro-grid-bg {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(to right, rgba(56,189,248,0.035) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(56,189,248,0.035) 1px, transparent 1px);
                    background-size: 48px 48px;
                    mask-image: radial-gradient(circle at center, black 45%, transparent 88%);
                    pointer-events: none; z-index: 1;
                }
                .intro-scanline {
                    position: absolute; inset: 0;
                    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px);
                    pointer-events: none; z-index: 2; animation: scanMove 7s linear infinite;
                }
                @keyframes scanMove { to { background-position: 0 48px; } }
                .intro-vignette {
                    position: absolute; inset: 0; pointer-events: none; z-index: 3;
                    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%);
                }
                .intro-corner { position: absolute; width: 42px; height: 42px; z-index: 10; opacity: 0.7; }
                .intro-corner.tl { top: 20px; left: 20px; border-top: 2px solid #38bdf8; border-left: 2px solid #38bdf8; }
                .intro-corner.tr { top: 20px; right: 20px; border-top: 2px solid #38bdf8; border-right: 2px solid #38bdf8; }
                .intro-corner.bl { bottom: 20px; left: 20px; border-bottom: 2px solid #38bdf8; border-left: 2px solid #38bdf8; }
                .intro-corner.br { bottom: 20px; right: 20px; border-bottom: 2px solid #38bdf8; border-right: 2px solid #38bdf8; }
                .intro-skip-btn {
                    position: absolute; top: 22px; right: 70px; display: flex; align-items: center; gap: 7px;
                    padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(15,23,42,0.72); backdrop-filter: blur(8px); color: #94a3b8;
                    font-size: 11px; font-weight: 700; letter-spacing: 0.07em; cursor: pointer; z-index: 20; font-family: inherit;
                }
                .intro-skip-btn:hover { color: #38bdf8; border-color: rgba(56,189,248,0.4); }
                .intro-esc-tag { padding: 1px 5px; border-radius: 4px; background: rgba(255,255,255,0.07); font-size: 9px; color: #cbd5e1; }
                .intro-top-hud {
                    position: absolute; top: 0; left: 0; right: 0; height: 48px; display: flex; align-items: center; justify-content: space-between;
                    padding: 0 24px; background: rgba(8,23,42,0.88); border-bottom: 1px solid rgba(56,189,248,0.18);
                    backdrop-filter: blur(14px); z-index: 15; font-size: 10.5px; font-weight: 700; letter-spacing: 0.07em;
                }
                .hud-left { display: flex; align-items: center; gap: 8px; color: #38bdf8; }
                .hud-center { color: #7dd3fc; font-family: ui-monospace, monospace; font-size: 13px; }
                .hud-right { color: #475569; font-family: ui-monospace, monospace; }
                .hud-dot.live { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: livePulse 1.5s infinite; }
                @keyframes livePulse { 50% { opacity: 0.35; transform: scale(1.4); } }
                .intro-side-hud { position: absolute; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 10px; z-index: 10; }
                .intro-side-hud.left { left: 24px; }
                .intro-side-hud.right { right: 24px; align-items: flex-end; }
                .side-hud-row { display: flex; align-items: center; gap: 8px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; animation: fadeInRow 0.5s ease forwards; opacity: 0; }
                @keyframes fadeInRow { to { opacity: 1; } }
                .side-hud-label { color: #64748b; min-width: 64px; }
                .side-hud-bar { width: 60px; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
                .side-hud-fill { height: 100%; background: linear-gradient(90deg, #0ea5e9, #38bdf8); animation: fillPulse 2.4s ease-in-out infinite; }
                @keyframes fillPulse { 50% { filter: brightness(1.4); } }
                .side-hud-status { font-size: 8px; padding: 2px 6px; border-radius: 3px; font-weight: 800; }
                .side-hud-status.ok { background: rgba(16,185,129,0.15); color: #10b981; }
                .side-hud-status.alert { background: rgba(239,68,68,0.15); color: #ef4444; }
                .side-hud-status.warn { background: rgba(245,158,11,0.15); color: #f59e0b; }
                .intro-main-content { display: flex; flex-direction: column; align-items: center; gap: 24px; z-index: 10; max-width: 620px; width: 90%; margin-top: 48px; }
                .intro-stat-row { display: flex; gap: 12px; }
                .intro-stat-card {
                    display: flex; flex-direction: column; align-items: center; padding: 10px 16px;
                    background: rgba(14,165,233,0.1); border: 1px solid rgba(56,189,248,0.22); border-radius: 10px;
                    backdrop-filter: blur(10px); min-width: 80px; animation: cardRise 0.7s ease both;
                }
                @keyframes cardRise { from { opacity: 0; transform: translateY(12px); } }
                .intro-stat-card strong { font-size: 18px; font-weight: 900; color: #38bdf8; }
                .intro-stat-card span { font-size: 8px; font-weight: 700; letter-spacing: 0.06em; color: #64748b; margin-top: 4px; }
                .intro-brand-block { display: flex; align-items: center; gap: 24px; }
                .intro-emblem { position: relative; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; }
                .emblem-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(56,189,248,0.4); }
                .emblem-ring.outer { width: 88px; height: 88px; animation: spinRing 10s linear infinite; border-style: dashed; }
                .emblem-ring.inner { width: 66px; height: 66px; animation: spinRing 7s linear infinite reverse; }
                @keyframes spinRing { to { transform: rotate(360deg); } }
                .intro-emblem svg { filter: drop-shadow(0 0 18px rgba(56,189,248,0.85)); animation: float3d 2.6s ease-in-out infinite alternate; }
                @keyframes float3d { from { transform: translateY(-4px) scale(0.96); } to { transform: translateY(4px) scale(1.04); } }
                .intro-ndma-tag { font-size: 9px; font-weight: 800; letter-spacing: 0.12em; color: #38bdf8; }
                .intro-brand-title {
                    margin: 0; font-size: 54px; font-weight: 900; letter-spacing: 0.2em; line-height: 1;
                    background: linear-gradient(135deg, #fff 0%, #7dd3fc 45%, #0284c7 100%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 32px rgba(56,189,248,0.55));
                    animation: titleGlow 2.8s ease-in-out infinite;
                }
                @keyframes titleGlow { 50% { filter: drop-shadow(0 0 46px rgba(56,189,248,0.9)); } }
                .intro-tagline { font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; color: #475569; }
                .intro-boot-card {
                    width: 100%; background: rgba(8,18,36,0.88); border: 1px solid rgba(56,189,248,0.22);
                    border-radius: 14px; padding: 16px 20px; backdrop-filter: blur(16px);
                    box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 40px rgba(14,165,233,0.12);
                }
                .boot-header { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
                .boot-terminal-dot { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; }
                .boot-terminal-dot.amber { background: #f59e0b; }
                .boot-terminal-dot.green { background: #10b981; }
                .boot-title { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: #475569; margin-left: 8px; }
                .boot-phase-text { font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: #7dd3fc; margin-bottom: 12px; height: 18px; }
                .intro-progress-track { height: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); overflow: hidden; border: 1px solid rgba(56,189,248,0.12); }
                .intro-progress-fill {
                    height: 100%; border-radius: 8px; position: relative; overflow: hidden;
                    background: linear-gradient(90deg, #0369a1, #0ea5e9, #38bdf8, #00f2fe);
                    box-shadow: 0 0 16px rgba(56,189,248,0.75); transition: width 0.05s linear;
                }
                .progress-shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent); animation: shimmerMove 1.4s linear infinite; }
                @keyframes shimmerMove { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
                .boot-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
                .boot-pct { font-size: 13px; font-weight: 900; color: #38bdf8; font-family: ui-monospace, monospace; }
                .boot-version { font-size: 9px; color: #334155; font-family: ui-monospace, monospace; }
                .intro-freq-bars { display: flex; align-items: flex-end; gap: 3px; height: 28px; }
                .freq-bar { width: 3px; border-radius: 2px; background: rgba(56,189,248,0.5); animation: freqAnim 0.85s ease-in-out infinite alternate; }
                @keyframes freqAnim { from { transform: scaleY(0.2); } to { transform: scaleY(1); background: #00f2fe; } }
                .intro-bottom-bar {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 38px; display: flex; align-items: center; justify-content: center; gap: 48px;
                    background: rgba(8,23,42,0.88); border-top: 1px solid rgba(56,189,248,0.14);
                    font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; color: #38bdf8; z-index: 15;
                }
                @media (max-width: 768px) {
                    .intro-side-hud { display: none; }
                    .intro-brand-title { font-size: 36px; }
                    .intro-hex-floor { display: none; }
                }
            `}</style>
        </div>
    );
}
