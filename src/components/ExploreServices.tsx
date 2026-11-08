"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ServiceCard } from "./ServiceCard";
import { AVAILABILITY, type Availability, type Category, type Service } from "@/lib/catalogue";

const FILTERS: (Availability | "all")[] = ["all", "available_now", "coming_soon", "planned", "subject_to_approval"];

export function ExploreServices({ initialQuery = "", categories, services }: { initialQuery?: string; categories: Category[]; services: Service[] }) {
  const [q, setQ] = useState(initialQuery);
  const [filter, setFilter] = useState<Availability | "all">("all");

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return services.filter((s) => {
      if (filter !== "all" && s.availability !== filter) return false;
      if (!needle) return true;
      const hay = [s.name, s.summary, s.categoryName, ...(s.keywords ?? [])].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [q, filter, services]);

  const count = (f: Availability | "all") => services.filter((s) => f === "all" || s.availability === f).length;

  return (
    <>
      <div className="flex h-12 items-center gap-2 rounded-ctl border border-line bg-white px-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green-tint">
        <Search size={18} className="text-text-muted" aria-hidden="true" />
        <label htmlFor="service-search" className="sr-only">Search services</label>
        <input id="service-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. boiler, haircut, dog walking" className="w-full bg-transparent outline-none" />
      </div>
      <div role="group" aria-label="Filter by availability" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm ${filter === f ? "border-green bg-green text-white" : "border-line bg-white hover:border-green"}`}>
            {f === "all" ? "All services" : AVAILABILITY[f].label}
            <span className="text-xs opacity-75">{count(f)}</span>
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Categories" className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:block lg:self-start lg:overflow-visible">
          {categories.map((c) => (
            <a key={c.slug} href={`#cat-${c.slug}`} className="block shrink-0 whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface lg:border-0 lg:py-2">{c.name}</a>
          ))}
        </nav>
        <div>
          {categories.map((c) => {
            const list = matches.filter((s) => s.category === c.slug);
            if (!list.length) return null;
            return (
              <section key={c.slug} id={`cat-${c.slug}`} className="mb-14 scroll-mt-28">
                <h2 className="display text-3xl">{c.name}</h2>
                <p className="mb-5 mt-1 text-text-muted">{c.description}</p>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((s) => <ServiceCard key={s.slug} service={s} />)}
                </div>
              </section>
            );
          })}
          {!matches.length && (
            <div className="rounded-card border border-dashed border-line p-12 text-center text-text-muted">
              <p className="font-semibold text-text">No services match “{q}”.</p>
              <p className="mt-1">Try a broader word, or clear the filter.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
