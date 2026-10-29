import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import api from "../api/api";
import "./Login.css";

const loginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(6, "Password must contain at least 6 characters"),
});

const signupSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(3, "Name must contain at least 3 characters")
            .max(50, "Name is too long")
            .regex(
                /^[A-Za-z]+(?: [A-Za-z]+)*$/,
                "Name can contain only letters and spaces"
            ),
        mobile: z
            .string()
            .trim()
            .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number"),
        email: z.string().trim().email("Enter a valid email address"),
        password: z.string().min(6, "Password must contain at least 6 characters"),
        confirmPassword: z.string().min(6, "Please confirm your password"),
        role: z.enum(["USER", "ADMIN"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// High-quality real disaster images from Unsplash
const DISASTER_IMAGES = [
    // Floods
    "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?auto=format&fit=crop&w=600&q=85",
    // Cyclones/Storms
    "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=85",
    // Earthquakes
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=85",
    // Wildfires
    "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1625225233840-695456021cde?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=600&q=85",
    // Tsunami
    "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=600&q=85",
    // Landslide
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=85",
    // Drought / cracked earth
    "https://images.unsplash.com/photo-1512036666432-2181c1f26420?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=85",
    // Emergency response
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=85",
    // Dark storm clouds
    "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=600&q=85",
    // Volcanic
    "https://images.unsplash.com/photo-1550159930-40066082a4fc?auto=format&fit=crop&w=600&q=85",
    // Aerial disaster views
    "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1519922639192-e73293ca430e?auto=format&fit=crop&w=600&q=85",
    "https://images.unsplash.com/photo-1561485132-59468cd0b553?auto=format&fit=crop&w=600&q=85",
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const ALERT_TICKERS = [
    { label: "CYCLONE ALERT", zone: "Andhra Pradesh", dot: "red" as const },
    { label: "FLOOD WARNING", zone: "Assam Valley", dot: "orange" as const },
    { label: "HIGH WINDS", zone: "Odisha Coast", dot: "yellow" as const },
];

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<"USER" | "ADMIN">("USER");
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);
    const collage = useMemo(() => shuffle(DISASTER_IMAGES), []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) { setError(result.error.issues[0].message); return; }
        try {
            setLoading(true);
            setError("");
            const response = await api.post("/auth/login", { email: email.trim(), password });
            const data = response.data;
            // Support both old shape (user object) and new JWT shape ({ token, user })
            const user = data.user || data;
            const token = data.token || "";
            try {
                if (token) localStorage.setItem("disastra_token", token);
                localStorage.setItem("disastra_user", JSON.stringify({
                    id: user.id,
                    name: user.name || user.email,
                    email: user.email || email.trim(),
                    mobile: user.mobile,
                    role: user.role,
                }));
            } catch { /* */ }
            if (user.role === "ADMIN") navigate("/admin");
            else navigate("/user");
        } catch (err: any) {
            if (err.response?.data) {
                const d = err.response.data;
                setError(typeof d === "string" ? d : (d.error || "Invalid email or password"));
            } else {
                setError("Cannot connect to the server. Make sure Spring Boot is running.");
            }
        } finally { setLoading(false); }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = signupSchema.safeParse({ name, mobile, email: signupEmail, password: signupPassword, confirmPassword, role });
        if (!result.success) { setError(result.error.issues[0].message); return; }
        try {
            setLoading(true);
            setError("");
            const response = await api.post("/auth/signup", { name: name.trim(), mobile: mobile.trim(), email: signupEmail.trim(), password: signupPassword, role });
            const data = response.data;
            const user = data.user || data;
            const token = data.token || "";
            try {
                if (token) localStorage.setItem("disastra_token", token);
                localStorage.setItem("disastra_user", JSON.stringify({
                    id: user.id,
                    name: user.name || name.trim(),
                    email: user.email || signupEmail.trim(),
                    mobile: user.mobile || mobile.trim(),
                    role: user.role || role,
                }));
            } catch { /* */ }
            if ((user.role || role) === "ADMIN") navigate("/admin");
            else navigate("/user");
        } catch (err: any) {
            if (err.response?.data) {
                const d = err.response.data;
                if (typeof d === "string") setError(d);
                else if (d.error) setError(d.error);
                else if (d.message) setError(d.message);
                else setError("Signup failed. Please check your details.");
            } else {
                setError("Cannot connect to the server. Make sure Spring Boot is running.");
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="login-pictory">
            <div className="login-hero-wrap">
                {/* Collage grid of disaster images */}
                <div className="login-collage" aria-hidden>
                    {collage.map((src, i) => (
                        <div
                            key={i}
                            className={`collage-cell ${hovered === i ? "is-glow" : ""}`}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <img
                                src={src}
                                alt=""
                                loading="lazy"
                                onError={(e) => {
                                    const el = e.currentTarget;
                                    if (!el.src.includes("picsum")) {
                                        el.src = `https://picsum.photos/seed/dis${i}/600/600`;
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Overlay effects */}
                <div className="login-collage-dim" />
                <div className="login-scanlines" />

                {/* Corner HUD brackets */}
                <div className="login-corner tl" />
                <div className="login-corner tr" />
                <div className="login-corner bl" />
                <div className="login-corner br" />

                {/* Top status bar */}
                <div className="login-top-bar">
                    <div className="login-top-bar-brand">
                        <div className="login-top-bar-dot" />
                        <span>DISASTRA · NATIONAL COMMAND NETWORK</span>
                    </div>
                    <div className="login-top-bar-right">
                        SEC-AUTH // AES-256 ENCRYPTED
                    </div>
                </div>

                {/* Side alert pills */}
                <div className="login-side-alerts">
                    {ALERT_TICKERS.map((a) => (
                        <div key={a.label} className="login-alert-pill">
                            <div className={`pill-dot ${a.dot}`} />
                            <div>
                                <div className="pill-text">{a.label}</div>
                                <div className="pill-label">{a.zone}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Center login card */}
                <div className={`login-center-card ${isSignup ? "is-signup-mode" : ""}`}>
                    <div className="login-card-accent" />
                    <div className="login-card-inner">
                        <div className="login-logo-row">
                            <div className="login-logo-mark">D</div>
                            <span>DISASTRA</span>
                        </div>
                        <span className="login-ndma-tag">National Disaster Management Authority · India</span>

                        <h1>{isSignup ? "Create Account" : "Secure Access"}</h1>

                        {!isSignup ? (
                            <form onSubmit={handleLogin} className="pictory-form" id="login-form">
                                <label>
                                    Email Address
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                    />
                                </label>
                                <label>
                                    Password
                                    <input
                                        id="login-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                </label>
                                {error && <div className="auth-error">{error}</div>}
                                <button type="submit" id="login-submit-btn" className="pictory-btn" disabled={loading}>
                                    {loading ? "Authenticating…" : "▶ LOGIN TO COMMAND CENTER"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSignup} className="pictory-form is-signup" id="signup-form">
                                <label>Full Name
                                    <input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                                </label>
                                <label>Mobile Number
                                    <input id="signup-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
                                </label>
                                <label>Email Address
                                    <input id="signup-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" />
                                </label>
                                <label>Password
                                    <input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Min 6 characters" />
                                </label>
                                <label>Confirm Password
                                    <input id="signup-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
                                </label>
                                <label>Account Role
                                    <select
  id="signup-role"
  value={role}
  onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
>
  <option value="USER">Field User</option>
  <option value="ADMIN">Admin</option>
</select>
                                </label>
                                {error && <div className="auth-error">{error}</div>}
                                <button type="submit" id="signup-submit-btn" className="pictory-btn" disabled={loading}>
                                    {loading ? "Creating Account…" : "▶ CREATE ACCOUNT"}
                                </button>
                            </form>
                        )}

                        <p className="pictory-switch">
                            {isSignup ? (
                                <>
                                    Already registered?{" "}
                                    <button type="button" id="switch-to-login" onClick={() => { setError(""); setIsSignup(false); }}>
                                        Sign In
                                    </button>
                                </>
                            ) : (
                                <>
                                    New to DISASTRA?{" "}
                                    <button type="button" id="switch-to-signup" onClick={() => { setError(""); setIsSignup(true); }}>
                                        Register
                                    </button>
                                </>
                            )}
                        </p>

                        {!isSignup && (
                            <>
                                <div className="login-card-divider" />
                                <div className="login-card-stats">
                                    <div className="login-card-stat">
                                        <strong>28</strong>
                                        <span>Active Zones</span>
                                    </div>
                                    <div className="login-card-stat">
                                        <strong>1,247</strong>
                                        <span>Units Active</span>
                                    </div>
                                    <div className="login-card-stat">
                                        <strong>99.8%</strong>
                                        <span>Uptime</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Scroll hint for public info */}
                <div className="login-scroll-hint" aria-hidden>
                    <span />
                    Scroll for disaster info
                </div>

                {/* Bottom bar */}
                <div className="login-bottom-bar">
                    <span>◉ NDMA CERTIFIED</span>
                    <span>◉ GOI APPROVED</span>
                    <span>◉ ISO 27001</span>
                    <span>◉ SECURE PORTAL</span>
                </div>
            </div>

            {/* Public climate & disaster knowledge — readable without login */}
            <section className="login-public-info" id="disaster-info">
                <div className="login-public-inner">
                    <div className="login-public-header">
                        <div className="pub-badge">Public Awareness · No Login Required</div>
                        <h2>Know Disasters. Stay Prepared.</h2>
                        <p>
                            Essential climate and disaster knowledge from NDMA guidelines.
                            Create an account only when you need personalized alerts, reporting, and command tools.
                        </p>
                    </div>

                    <div className="login-climate-strip">
                        <div className="login-climate-chip"><strong>36°C</strong><span>Peak Summer</span></div>
                        <div className="login-climate-chip"><strong>Monsoon</strong><span>Jun – Sep</span></div>
                        <div className="login-climate-chip"><strong>Cyclone</strong><span>Bay of Bengal</span></div>
                        <div className="login-climate-chip"><strong>Seismic</strong><span>Zone III–V</span></div>
                        <div className="login-climate-chip"><strong>Flood</strong><span>River Basins</span></div>
                        <div className="login-climate-chip"><strong>Drought</strong><span>Rain-shadow</span></div>
                    </div>

                    <div className="login-info-grid">
                        <article className="login-info-card">
                            <div className="info-icon">🌊</div>
                            <h3>Floods</h3>
                            <p>Heavy monsoon and river overflow are the most frequent disasters in India.</p>
                            <ul>
                                <li>Move to higher ground immediately</li>
                                <li>Avoid walking through flood water</li>
                                <li>Keep emergency kit &amp; documents ready</li>
                            </ul>
                        </article>
                        <article className="login-info-card">
                            <div className="info-icon">🌀</div>
                            <h3>Cyclones</h3>
                            <p>Bay of Bengal and Arabian Sea systems can make landfall with extreme winds and surge.</p>
                            <ul>
                                <li>Follow IMD / NDMA evacuation orders</li>
                                <li>Secure loose outdoor items</li>
                                <li>Stay indoors away from windows</li>
                            </ul>
                        </article>
                        <article className="login-info-card">
                            <div className="info-icon">🏚️</div>
                            <h3>Earthquakes</h3>
                            <p>Much of the Himalayan belt and parts of the peninsula lie in high seismic zones.</p>
                            <ul>
                                <li>Drop, Cover, Hold On</li>
                                <li>Stay clear of elevators after shaking</li>
                                <li>Check for gas / electrical hazards</li>
                            </ul>
                        </article>
                        <article className="login-info-card">
                            <div className="info-icon">🔥</div>
                            <h3>Wildfires &amp; Heat</h3>
                            <p>Rising temperatures increase heatwave and forest-fire risk across many states.</p>
                            <ul>
                                <li>Avoid outdoor work in peak heat</li>
                                <li>Hydrate; never leave children in cars</li>
                                <li>Report smoke / fire to local control</li>
                            </ul>
                        </article>
                        <article className="login-info-card">
                            <div className="info-icon">⛰️</div>
                            <h3>Landslides</h3>
                            <p>Hilly regions see slope failure during intense rainfall and after earthquakes.</p>
                            <ul>
                                <li>Avoid travel on cracked roads</li>
                                <li>Watch for sudden water / mud flow</li>
                                <li>Evacuate if authorities advise</li>
                            </ul>
                        </article>
                        <article className="login-info-card">
                            <div className="info-icon">📡</div>
                            <h3>Early Warning</h3>
                            <p>India’s multi-hazard early warning systems (IMD, CWC, INCOIS) save lives when heeded.</p>
                            <ul>
                                <li>Enable mobile alerts (NDMA / SACHET)</li>
                                <li>Know your nearest shelter route</li>
                                <li>Share verified info only</li>
                            </ul>
                        </article>
                    </div>

                    <div className="login-climate-deep">
                        <h3>India’s climate &amp; hazard calendar</h3>
                        <p>
                            You do not need an account to learn this. Login only creates a personal DISASTRA profile
                            for reports, alerts, and command tools.
                        </p>
                        <div className="login-season-grid">
                            <article>
                                <img src="https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=900&q=85" alt="Monsoon floods" />
                                <div>
                                    <strong>Jun – Sep · Southwest monsoon</strong>
                                    <p>Peak flood, landslide and urban waterlogging risk across river basins, Ghats and Northeast. Keep documents waterproof and avoid driving through water.</p>
                                </div>
                            </article>
                            <article>
                                <img src="https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=900&q=85" alt="Cyclone clouds" />
                                <div>
                                    <strong>Apr – Jun &amp; Oct – Dec · Cyclone seasons</strong>
                                    <p>Bay of Bengal systems are typically more intense. Follow IMD cone of uncertainty, evacuate low-lying coasts, and stay indoors through the storm eye.</p>
                                </div>
                            </article>
                            <article>
                                <img src="https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=900&q=85" alt="Heat and drought" />
                                <div>
                                    <strong>Mar – Jun · Heatwave &amp; drought belt</strong>
                                    <p>Northwest and Deccan plains see extreme heat. Hydrate, rest in shade 12–15 hrs, never leave children in vehicles, and watch NDMA heat-action plans.</p>
                                </div>
                            </article>
                            <article>
                                <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85" alt="Himalayan slopes" />
                                <div>
                                    <strong>Year-round · Himalaya seismic &amp; slope risk</strong>
                                    <p>Zone IV–V districts should practise Drop-Cover-Hold, secure heavy furniture, and avoid travel on cracked hill roads after heavy rain.</p>
                                </div>
                            </article>
                        </div>
                    </div>

                    <div className="login-kit-panel">
                        <h3>72-hour family emergency kit</h3>
                        <ul>
                            <li>3 litres drinking water per person per day</li>
                            <li>Ready-to-eat food, ORS, basic medicines</li>
                            <li>Torch, power bank, whistle, cash</li>
                            <li>IDs, insurance, bank papers in a waterproof pouch</li>
                            <li>NDMA / SACHET alerts enabled on one phone</li>
                        </ul>
                    </div>

                    <div className="login-helpline-bar">
                        <span className="hl-label">National Emergency</span>
                        <span className="hl-num">112</span>
                        <span className="hl-sep" />
                        <span className="hl-label">NDMA Helpline</span>
                        <span className="hl-num">1078</span>
                        <span className="hl-sep" />
                        <span className="hl-label">Disaster Relief</span>
                        <span className="hl-num">1070</span>
                        <span className="hl-sep" />
                        <span className="hl-label">Police</span>
                        <span className="hl-num">100</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Login;
