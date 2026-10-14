const KEY = "disastra_theme";

/** Only dark + green. "light" kept as soft dark-green variant for contrast, not white. */
export type ThemeMode = "dark" | "green";

export function getTheme(): ThemeMode {
    try {
        const v = localStorage.getItem(KEY);
        if (v === "green" || v === "dark") return v;
        // migrate old "light"
        if (v === "light") return "green";
    } catch {
        /* */
    }
    return "dark";
}

export function applyTheme(mode: ThemeMode) {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    root.classList.remove("theme-dark", "theme-light", "theme-green");
    root.classList.add(mode === "green" ? "theme-green" : "theme-dark");
    try {
        localStorage.setItem(KEY, mode);
    } catch {
        /* */
    }
}

export function toggleTheme(): ThemeMode {
    const next: ThemeMode = getTheme() === "dark" ? "green" : "dark";
    applyTheme(next);
    return next;
}

export function initTheme() {
    applyTheme(getTheme());
}
