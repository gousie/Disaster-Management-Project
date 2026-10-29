import { useEffect, useState } from "react";

/**
 * Cycles through 3 themes on each click:
 *  1. dark   → Sky blue command center (default)
 *  2. light  → Emerald white
 *  3. violet → Violet aurora
 *
 * Persists choice in localStorage key "disastra-theme".
 * Sets data-theme on <html> so AdminDashboard.css / UserDashboard.css apply.
 */

const THEMES = ["dark", "light", "violet"] as const;
type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "disastra-theme";

function getStoredTheme(): Theme {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === "dark" || v === "light" || v === "violet") return v;
    } catch (_) {}
    return "dark";
}

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.remove("light", "dark", "violet");
    document.documentElement.classList.add(theme);
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
}

interface ThemeToggleProps {
    className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
    const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const cycle = () => {
        const idx = THEMES.indexOf(theme);
        const next = THEMES[(idx + 1) % THEMES.length];
        setTheme(next);
    };

    const label =
        theme === "dark"
            ? "Dark blue"
            : theme === "light"
              ? "Emerald white"
              : "Violet aurora";

    return (
        <button
            type="button"
            className={["theme-toggle-btn", className].filter(Boolean).join(" ")}
            onClick={cycle}
            title={`Theme: ${label} (click for next)`}
            aria-label={`Current theme ${label}. Click to cycle themes.`}
            style={{
                position: "relative",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
                padding: 0,
            }}
        >
            {theme === "dark" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
            {theme === "light" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            )}
            {theme === "violet" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    <path d="M19 3v4M21 5h-4" />
                </svg>
            )}

            <span
                style={{
                    position: "absolute",
                    bottom: 3,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 3,
                }}
            >
                {THEMES.map((t) => (
                    <span
                        key={t}
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background:
                                t === "dark"
                                    ? "#38bdf8"
                                    : t === "light"
                                      ? "#10b981"
                                      : "#a78bfa",
                            opacity: theme === t ? 1 : 0.25,
                            boxShadow:
                                theme === t
                                    ? `0 0 4px ${
                                          t === "dark"
                                              ? "#38bdf8"
                                              : t === "light"
                                                ? "#10b981"
                                                : "#a78bfa"
                                      }`
                                    : "none",
                            transition: "opacity 0.2s",
                        }}
                    />
                ))}
            </span>
        </button>
    );
}