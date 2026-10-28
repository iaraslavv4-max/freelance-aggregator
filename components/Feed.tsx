"use client";

import { useState, useMemo, useTransition, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { JobItem } from "@/lib/jobs";

const savedJobsKey = "saved_jobs";
const savedJobsUpdatedEvent = "saved-jobs-updated";

function subscribeToSavedJobs(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(savedJobsUpdatedEvent, onStoreChange);
    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(savedJobsUpdatedEvent, onStoreChange);
    };
}

function getSavedJobsSnapshot() {
    try {
        return localStorage.getItem(savedJobsKey) || "[]";
    } catch {
        return "[]";
    }
}

function getServerSavedJobsSnapshot() {
    return "[]";
}

function parseSavedJobs(snapshot: string) {
    try {
        const saved: unknown = JSON.parse(snapshot);
        return Array.isArray(saved) && saved.every((id) => typeof id === "string") ? saved as string[] : [];
    } catch {
        return [];
    }
}

export default function Feed({ initialItems, loadError }: { initialItems: JobItem[]; loadError: string | null }) {
    const [search, setSearch] = useState("");
    const [isRefreshing, startRefresh] = useTransition();
    const savedSnapshot = useSyncExternalStore(subscribeToSavedJobs, getSavedJobsSnapshot, getServerSavedJobsSnapshot);
    const savedIds = parseSavedJobs(savedSnapshot);
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const router = useRouter();

    const toggleSave = (link: string) => {
        let newSaved: string[];
        if (savedIds.includes(link)) {
            newSaved = savedIds.filter((id) => id !== link);
        } else {
            newSaved = [...savedIds, link];
        }
        try {
            localStorage.setItem(savedJobsKey, JSON.stringify(newSaved));
            window.dispatchEvent(new Event(savedJobsUpdatedEvent));
        } catch {
            setToastMessage("Не удалось сохранить избранное.");
        }
    };

    const handleCopy = async (link: string) => {
        try {
            await navigator.clipboard.writeText(link);
            setToastMessage("Ссылка скопирована!");
        } catch {
            setToastMessage("Не удалось скопировать ссылку.");
        }
        setTimeout(() => setToastMessage(null), 3000);
    };

    const categories = useMemo(() => {
        const cats = new Set<string>();
        initialItems.forEach((item) => item.categories.forEach((category) => cats.add(category)));
        return Array.from(cats).sort();
    }, [initialItems]);

    const processedItems = initialItems.filter((item) => {
        const searchLower = search.toLowerCase();
        const title = (item.title || "").toLowerCase();
        const desc = item.contentSnippet.toLowerCase();
        const matchesSearch = title.includes(searchLower) || desc.includes(searchLower);
        const matchesCategory = selectedCategory === "all" || item.categories.includes(selectedCategory);
        const matchesSaved = !showSavedOnly || savedIds.includes(item.link);
        return matchesSearch && matchesCategory && matchesSaved;
    });

    processedItems.sort((a, b) => {
        const dateA = new Date(a.pubDate || 0).getTime();
        const dateB = new Date(b.pubDate || 0).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    const handleRefresh = () => {
        startRefresh(() => router.refresh());
    };

    return (
        <div className="relative">
            {toastMessage && (
                <div role="status" aria-live="polite" className="fixed bottom-10 left-1/2 z-50 w-[90%] -translate-x-1/2 rounded-full bg-slate-900 px-6 py-3 text-center font-bold text-white shadow-2xl transition-all duration-300 sm:w-auto dark:bg-cyan-300 dark:text-slate-950">
                    {toastMessage}
                </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/70">
                    Найдено: <strong className="text-slate-950 dark:text-white">{processedItems.length}</strong>
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/70">
                    В избранном: <strong className="text-slate-950 dark:text-white">{savedIds.length}</strong>
                </span>
            </div>

            {loadError && (
                <div role="alert" className="mb-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                    {loadError}
                </div>
            )}

            {/* Панель управления (Матовое стекло) */}
            <div className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-colors md:p-6 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        aria-label="Поиск по заказам"
                        type="text"
                        placeholder="Поиск по заказам..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full flex-grow rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                    />
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="w-full cursor-pointer whitespace-nowrap rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white shadow-md shadow-cyan-950/10 transition-all hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-50 md:w-auto dark:bg-cyan-300 dark:text-slate-950 dark:shadow-cyan-950/20 dark:hover:bg-cyan-200"
                    >
                        {isRefreshing ? "Обновление..." : "Обновить"}
                    </button>
                </div>

                <div className="flex flex-col items-start gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 dark:border-slate-800">
                    {categories.length > 0 && (
                        <select
                            aria-label="Фильтр по категории"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none sm:w-auto dark:border-slate-700 dark:bg-slate-950/70 dark:text-white"
                        >
                            <option value="all">Все категории</option>
                            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                    )}

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                        aria-label="Сортировка заказов"
                        className="w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none sm:w-auto dark:border-slate-700 dark:bg-slate-950/70 dark:text-white"
                    >
                        <option value="newest">Сначала новые</option>
                        <option value="oldest">Сначала старые</option>
                    </select>

                    <label className="mt-2 flex w-full cursor-pointer items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-950 sm:ml-auto sm:mt-0 sm:w-auto dark:text-slate-300 dark:hover:text-white">
                        <input
                            type="checkbox"
                            checked={showSavedOnly}
                            onChange={(e) => setShowSavedOnly(e.target.checked)}
                            className="h-4 w-4 cursor-pointer rounded accent-cyan-600 dark:accent-cyan-300"
                        />
                        Только избранные ❤️
                    </label>
                </div>
            </div>

            {/* Сетка заказов */}
            {processedItems.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white/80 py-20 text-center backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
                    <p className="text-slate-600 dark:text-slate-300">{loadError ? "Лента временно недоступна." : initialItems.length === 0 ? "Пока нет доступных заказов." : "Ничего не найдено по вашим фильтрам."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {processedItems.map((item) => {
                        const isSaved = savedIds.includes(item.link);

                        return (
                            <div
                                key={item.link}
                                className={`flex flex-col justify-between rounded-2xl border bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 md:p-6 dark:bg-slate-900/80 dark:hover:shadow-black/30 ${isSaved
                                    ? "border-cyan-500/60 ring-1 ring-cyan-500/20 dark:border-cyan-400/60"
                                    : "border-slate-200 hover:border-cyan-300 dark:border-slate-800 dark:hover:border-slate-700"
                                    }`}
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <h2 className="line-clamp-2 text-lg font-bold leading-snug text-slate-950 md:text-xl dark:text-white">
                                            {item.title}
                                        </h2>
                                        <button
                                            onClick={() => toggleSave(item.link)}
                                            type="button"
                                            aria-label={isSaved ? "Убрать из избранного" : "Добавить в избранное"}
                                            aria-pressed={isSaved}
                                            className="shrink-0 cursor-pointer rounded-full p-1 text-2xl transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                        >
                                            {isSaved ? "❤️" : "🤍"}
                                        </button>
                                    </div>

                                    {item.categories && item.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {item.categories.map((cat: string, i: number) => (
                                                <span key={i} className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:border-cyan-900/70 dark:bg-cyan-950/50 dark:text-cyan-200">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="mb-6 line-clamp-4 overflow-hidden text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        {item.contentSnippet}
                                    </p>
                                </div>

                                {/* Адаптивный подвал карточки */}
                                <div className="mt-auto flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center dark:border-slate-800">
                                    <span className="order-2 text-center text-xs font-medium text-slate-500 sm:order-1 sm:text-left dark:text-slate-400">
                                        {item.pubDate ? new Date(item.pubDate).toLocaleDateString("ru-RU", { hour: '2-digit', minute: '2-digit' }) : ""}
                                    </span>

                                    <div className="order-1 flex w-full items-center justify-between gap-2 sm:order-2 sm:w-auto sm:justify-end">
                                        <button
                                            onClick={() => handleCopy(item.link)}
                                            type="button"
                                            aria-label="Скопировать ссылку на заказ"
                                            className="shrink-0 cursor-pointer rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-cyan-200"
                                            title="Скопировать ссылку"
                                        >
                                            📋
                                        </button>

                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full cursor-pointer rounded-lg bg-cyan-600 px-4 py-2 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-700 sm:w-auto dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
                                        >
                                            Открыть
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}