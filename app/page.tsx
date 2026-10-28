import { Suspense } from "react";
import Feed from "@/components/Feed";
import ThemeToggle from "@/components/ThemeToggle";
import { getJobs } from "@/lib/jobs";

export const dynamic = 'force-dynamic';

async function OrdersData() {
  const { items, error } = await getJobs();
  return <Feed initialItems={items} loadError={error} />;
}

export default function Home() {
  return (
    <main className="relative min-h-screen px-4 py-8 md:px-8 md:py-12">
      <ThemeToggle />
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-9 pt-10 text-center sm:pt-4 sm:text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
            FL.RU · ЛЕНТА ПРОЕКТОВ
          </p>
          <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
            Свежие <span className="text-cyan-700 dark:text-cyan-300">заказы</span>
          </h1>
          <p className="text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Подходящие проекты — в одном месте.
          </p>
        </header>

        <Suspense fallback={
          <div className="text-center py-20">
            <p className="text-slate-500 animate-pulse text-xl">Загружаем заказы...</p>
          </div>
        }>
          <OrdersData />
        </Suspense>
      </div>
    </main>
  );
}