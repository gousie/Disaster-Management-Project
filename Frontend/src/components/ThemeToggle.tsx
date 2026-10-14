import { useEffect, useState } from "react";
import { getTheme, toggleTheme, type ThemeMode } from "../utils/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
    const [mode, setMode] = useState<ThemeMode>("dark");

    useEffect(() => {
        setMode(getTheme());
    }, []);

    return (
        <button
            type="button"
            className={`theme-toggle-btn ${className}`}
            title={mode === "dark" ? "Emerald accent" : "Deep dark"}
            onClick={() => setMode(toggleTheme())}
        >
            {mode === "dark" ? "Emerald" : "Deep dark"}
        </button>
    );
}
