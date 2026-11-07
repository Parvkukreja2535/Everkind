import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, ShieldCheck, X } from "lucide-react";
import { AvailabilityChip } from "@/components/AvailabilityChip";
import { BookingPanel } from "@/components/BookingPanel";
import { InterestForm } from "@/components/InterestForm";
import { AVAILABILITY, LISTED_SERVICES, getCategory, getService, priceLabel, serviceHref } from "@/lib/catalogue";
import { isBookable } from "@/lib/booking";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return LISTED_SERVICES.map((s) => ({ category: s.category, service: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; service: string }> }): Promise<Metadata> {
  const s = getService((await params).service);
  return s ? { title: s.name, description: s.summary, openGraph: { images: [s.image] } } : {};
}

const WHO = {
  employed: "An Everkind-employed, trained team member",
  contractor: "A vetted independent professional",
  regulated: "Only appropriately qualified and registered professionals",
};

const REGULATED_NOTICE: Record<string, string> = {
  "gas-services": "Gas work may only be carried out by Gas Safe registered businesses and engineers.",
  childcare: "Childcare involves safeguarding, DBS checks and possible Ofsted registration.",
  electrical: "Electrical work needs qualified electricians and must meet building regulations.",
  "air-conditioning": "Air-conditioning work needs F-Gas certified specialists.",
  "pest-control": "Pest treatment needs trained specialists, approved products and treatment records.",
};

export default async function ServicePage({ params }: { params: Promise<{ category: string; service: string }> }) {
  const { category, service: slug } = await params;
  const s = getService(slug);
  if (!s || s.category !== category) notFound();
  const c = getCategory(s.category)!;
  const bookable = isBookable(s as typeof s | undefined); // cast keeps `s` un-narrowed in the not-bookable branch
  const isInstant = s.slug === "instant-clean";
  const how = isInstant
    ? "Book now; we assign an on-duty cleaner and send an estimated arrival time"
    : !bookable ? "Not yet bookable"
    : s.workforce === "employed" ? "Book a time; we confirm your team member and arrival window"
    : "Send a request; confirmed once a professional accepts";
  const related = LISTED_SERVICES.filter((x) => x.category === s.category && x.slug !== s.slug).slice(0, 3);

  return (
    <div className="wrap pb-24">
      <p className="pt-6 text-sm text-text-muted">
        <Link href="/" className="hover:text-green">Home</Link> / <Link href="/services" className="hover:text-green">All services</Link> / <Link href={`/services/${c.slug}`} className="hover:text-green">{c.name}</Link>
      </p>
      <div className="grid items-start gap-12 py-8 lg:grid-cols-[1.25fr_.9fr]">
        <div className="min-w-0">
          <AvailabilityChip availability={s.availability} />
          <h1 className="display mt-4 text-[clamp(34px,4.4vw,52px)] leading-[1.1]">{s.name}</h1>
          <p className="mt-4 max-w-[620px] text-lg text-text-muted">{s.summary}</p>
          <div className="relative mt-7 aspect-[16/8] overflow-hidden rounded-2xl bg-surface">
            <Image src={s.image} alt={s.name} fill priority sizes="(min-width:1024px) 640px, 100vw" className="object-cover" />
          </div>
          <p className="mt-2 text-xs text-text-muted">Illustrative photo from Unsplash.</p>

          <dl className="mt-7 grid gap-4 sm:grid-cols-3">
            {[["Who does the work", WHO[s.workforce]], ["How booking works", how], ["Hours", SITE.hours]].map(([k, v]) => (
              <div key={k} className="card p-4 text-sm"><dt className="text-[12.5px] text-text-muted">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
            ))}
          </dl>

          {s.included.length > 0 && (
            <section id="included" className="mt-10 scroll-mt-24">
              <h2 className="mb-3 text-xl font-semibold">{isInstant ? "Tasks you can choose" : "What's included"}</h2>
              <ul className="grid gap-2">{s.included.map((t) => <li key={t} className="flex gap-2.5"><Check size={18} className="mt-1 shrink-0 text-status-ok" aria-hidden="true" />{t}</li>)}</ul>
            </section>
          )}
          {s.excluded.length > 0 && (
            <section className="mt-9">
              <h2 className="mb-3 text-xl font-semibold">Not included</h2>
              <ul className="grid gap-2">{s.excluded.map((t) => <li key={t} className="flex gap-2.5"><X size={18} className="mt-1 shrink-0 text-status-err" aria-hidden="true" />{t}</li>)}</ul>
            </section>
          )}
          {isInstant && (
            <section className="mt-9">
              <h2 className="mb-3 text-xl font-semibold">How Instant Clean works</h2>
              <ul className="grid gap-2 text-text-muted">
                <li>Billed by the hour at {priceLabel(s).toLowerCase()}, with a 1-hour minimum. Add more hours if you need them; you'll see the total before you confirm.</li>
                <li>Your cleaner works through your selected tasks in priority order within the time booked. We can't guarantee every task will be completed in the time chosen.</li>
                <li>After booking you'll get an estimated arrival time. Arrival times are estimates and may change.</li>
                <li>Available {SITE.hours}; the job must finish by 8:00pm.</li>
              </ul>
            </section>
          )}
          <section className="mt-9">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={20} className="text-green" aria-hidden="true" />Checks and standards</h2>
            <p className="max-w-[640px] text-text-muted">{s.checks}</p>
          </section>
          {bookable && (
            <section className="mt-9">
              <h2 className="mb-3 text-xl font-semibold">Before you book</h2>
              <p className="max-w-[640px] text-text-muted">{SITE.cancellation} {SITE.noPayment}</p>
            </section>
          )}
          {related.length > 0 && (
            <section className="mt-9">
              <h2 className="mb-3 text-xl font-semibold">More in {c.name}</h2>
              <div className="flex flex-wrap gap-2">{related.map((r) => <Link key={r.slug} href={serviceHref(r)} className="rounded-full border border-line px-3.5 py-1.5 text-sm hover:border-green">{r.name}</Link>)}</div>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          {bookable ? (
            <BookingPanel service={s} />
          ) : (
            <aside className="card p-6">
              <h2 className="text-lg font-semibold">{AVAILABILITY[s.availability].action === "Notify me" ? "Notify me when available" : "Register interest"}</h2>
              {s.availability === "coming_soon" && <p className="mt-1 text-xl font-semibold tabular-nums">{priceLabel(s)}</p>}
              {s.availability === "subject_to_approval" ? (
                <p className="mt-3 flex gap-2.5 rounded-ctl border border-amber-line bg-amber-tint p-3 text-sm"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-status-warn" aria-hidden="true" /><span>{REGULATED_NOTICE[s.category]} <b>Everkind does not currently provide this service.</b> It will only be offered once the required approvals are in place.</span></p>
              ) : (
                <p className="mt-3 flex gap-2.5 rounded-ctl bg-[#E3ECF1] p-3 text-sm text-[#24485C]"><Clock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{AVAILABILITY[s.availability].meaning} We don't have a launch date yet.</p>
              )}
              <div className="mt-5"><InterestForm service={s} /></div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
