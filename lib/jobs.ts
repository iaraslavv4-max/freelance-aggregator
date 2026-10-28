import Parser from "rss-parser";

export type JobItem = {
    title: string;
    link: string;
    contentSnippet: string;
    pubDate: string;
    categories: string[];
};

type ParsedJob = {
    title?: string;
    link?: string;
    guid?: string;
    contentSnippet?: string;
    summary?: string;
    pubDate?: string;
    isoDate?: string;
    categories?: string[];
};

const feedUrl = "https://www.fl.ru/rss/all.xml";
const loadErrorMessage = "Не удалось загрузить заказы. Попробуйте обновить ленту позже.";

export async function getJobs(): Promise<{ items: JobItem[]; error: string | null }> {
    try {
        const response = await fetch(feedUrl, {
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return { items: [], error: loadErrorMessage };
        }

        const parser = new Parser<Record<string, never>, ParsedJob>();
        const feed = await parser.parseString(await response.text());
        const items = feed.items.flatMap((item): JobItem[] => {
            const link = item.link || item.guid || "";

            try {
                const url = new URL(link);
                if (url.protocol !== "http:" && url.protocol !== "https:") return [];
            } catch {
                return [];
            }

            return [{
                title: item.title?.trim() || "Заказ без названия",
                link,
                contentSnippet: item.contentSnippet?.trim() || item.summary?.trim() || "Описание отсутствует",
                pubDate: item.isoDate || item.pubDate || "",
                categories: [...new Set((item.categories || []).map((category) => category.trim()).filter(Boolean))],
            }];
        });

        return { items, error: null };
    } catch {
        return { items: [], error: loadErrorMessage };
    }
}