"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => { };
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ThemeToggle() {
    const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
    const { theme, setTheme } = useTheme();

    if (!mounted) {
        return <div className="w-10 h-10 md:w-12 md:h-12"></div>;
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="fixed right-4 top-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-lg shadow-lg shadow-slate-900/10 transition-all duration-200 hover:scale-110 active:scale-95 md:right-6 md:top-6 md:h-12 md:w-12 md:text-xl dark:border-slate-700 dark:bg-slate-900"
            aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        >
            {theme === "dark" ? "☀️" : "🌙"}
        </button>
    );
}