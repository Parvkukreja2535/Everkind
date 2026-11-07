import type { Metadata } from "next";
import { ExploreServices } from "@/components/ExploreServices";
import { AvailabilityChip } from "@/components/AvailabilityChip";
import { AVAILABILITY, type Availability } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Explore all services",
  description: "Every home and personal service Everkind offers today and plans to offer, from cleaning and beauty to handyman, plumbing and pet care.",
};

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="wrap pb-24">
      <header className="py-14">
        <p className="eyebrow">Explore all services</p>
        <h1 className="display mt-3 text-[clamp(38px,5vw,58px)] leading-[1.08]">Everything your home needs. One place.</h1>
        <p className="mt-3 max-w-[640px] text-lg text-text-muted">Browse every service Everkind offers today and plans to offer. Only services marked <b>Available now</b> can be booked.</p>
        <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(AVAILABILITY) as Availability[]).map((a) => (
            <div key={a} className="text-sm text-text-muted"><dt><AvailabilityChip availability={a} /></dt><dd className="mt-1.5">{AVAILABILITY[a].meaning}</dd></div>
          ))}
        </dl>
      </header>
      <ExploreServices initialQuery={q ?? ""} />
    </div>
  );
}
