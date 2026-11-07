import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/Prose";
import { ServiceCard } from "@/components/ServiceCard";
import { LISTED_SERVICES } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "For hosts & property managers", description: "Short-let and Airbnb turnover cleaning in central London by Everkind's own trained team." };

export default function HostsPage() {
  const turnovers = LISTED_SERVICES.filter((s) => s.slug.startsWith("short-let"));
  return (
    <div className="wrap pb-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <PageHeader eyebrow="For hosts & property managers" title="Turnovers handled between every stay" intro="Everkind's employed cleaners reset your short-let between check-out and check-in, following your property checklist, with photos when the clean is done." />
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src="/images/services/1556911220-bff31c812dba.jpg" alt="A clean, modern kitchen" fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover" /></div>
      </div>
      <h2 className="display mt-10 text-3xl">Turnover prices</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{turnovers.map((s) => <ServiceCard key={s.slug} service={s} />)}</div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {[
          ["Your checklist, every time", "Tell us your linen rules, access instructions and anything guests always miss. We follow the same checklist on every turnover."],
          ["Photos when we're done", "You get a photo checklist after each clean, so you can see the property is guest-ready."],
          ["Business accounts coming soon", "Save several properties under one account and see bookings by property. Until then, book each turnover on its service page."],
        ].map(([t, d]) => <div key={t} className="card p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-[15px] text-text-muted">{d}</p></div>)}
      </div>
      <div className="card mt-14 flex flex-wrap items-center justify-between gap-4 p-6">
        <div><h2 className="text-lg font-semibold">Managing several properties?</h2><p className="text-text-muted">Email us and we'll set things up with you: <span className="select-all font-semibold text-text">{SITE.email}</span></p></div>
        <Link href="/services/cleaning/short-let-turnover-1-bedroom" className="btn-primary">Book a turnover</Link>
      </div>
    </div>
  );
}
