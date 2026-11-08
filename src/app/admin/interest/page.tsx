import Link from "next/link";
import { Empty, Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { AvailabilityChip } from "@/components/AvailabilityChip";
import { requireAdmin } from "@/lib/auth";
import type { Availability } from "@/lib/catalogue";
import { dateTime } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyInterestAction } from "../actions";

export const metadata = { title: "Interest registrations" };

export default async function AdminInterest({ searchParams }: { searchParams: Promise<{ category?: string; service?: string; from?: string; notified?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = (await supabaseServer())!;
  const [{ data: cats }, { data: services }] = await Promise.all([
    db.from("categories").select("id, slug, name").order("sort_order"),
    db.from("services").select("slug, name, availability, category_id").order("sort_order"),
  ]);
  const inCat = sp.category ? (services ?? []).filter((s) => s.category_id === sp.category).map((s) => s.slug) : null;
  let q = db.from("service_interest").select("*");
  if (sp.service) q = q.eq("service_slug", sp.service);
  else if (inCat) q = q.in("service_slug", inCat.length ? inCat : ["-"]);
  if (sp.from) q = q.gte("created_at", sp.from);
  const { data: rows } = await q.order("created_at", { ascending: false }).limit(500);
  const svc = Object.fromEntries((services ?? []).map((s) => [s.slug, s]));
  const totals = Object.entries((rows ?? []).reduce<Record<string, number>>((m, r) => ({ ...m, [r.service_slug]: (m[r.service_slug] ?? 0) + (r.unsubscribed_at ? 0 : 1) }), {})).sort((a, b) => b[1] - a[1]);
  const exportHref = `/admin/interest/export?${new URLSearchParams(Object.entries({ category: sp.category ?? "", service: sp.service ?? "", from: sp.from ?? "" }).filter(([, v]) => v)).toString()}`;
  return (
    <>
      <PageTitle title="Interest registrations" intro="People who asked to hear when a service launches. Only email them about the service they chose, and only those who haven't unsubscribed." action={<Link href={exportHref} className="btn-secondary">Export CSV</Link>} />
      {sp.notified && <div className="mb-4"><Notice tone={sp.notified === "not-live" ? "warn" : "ok"}>{sp.notified === "not-live" ? "Launch emails can only be sent once a service is 'Available now'." : `${sp.notified} launch email${sp.notified === "1" ? "" : "s"} created. They're delivered once email sending is connected; until then they're saved in the email log.`}</Notice></div>}
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <select name="category" defaultValue={sp.category ?? ""} aria-label="Category" className="input"><option value="">All categories</option>{(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="service" defaultValue={sp.service ?? ""} aria-label="Service" className="input"><option value="">All services</option>{(services ?? []).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from} aria-label="Registered since" className="input" />
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <Panel title="Most wanted">
          {totals.length ? (
            <ul className="grid gap-3 text-sm">{totals.map(([slug, n]) => (
              <li key={slug} className="flex flex-wrap items-center justify-between gap-2">
                <span><b>{svc[slug]?.name ?? slug}</b> · {n} {svc[slug] && <AvailabilityChip availability={svc[slug].availability as Availability} />}</span>
                {svc[slug]?.availability === "available_now" && n > 0 && <form action={notifyInterestAction}><input type="hidden" name="service_slug" value={slug} /><button className="btn-primary btn-sm">Send launch email</button></form>}
              </li>))}</ul>
          ) : <Empty>No registrations yet.</Empty>}
        </Panel>
        <Panel title={`Registrations (${rows?.length ?? 0})`}>
          {rows?.length ? (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="py-2 pr-3">Service</th><th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Postcode</th><th className="py-2 pr-3">News opt-in</th><th className="py-2">Registered</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id} className={`border-b border-line last:border-0 ${r.unsubscribed_at ? "text-text-muted line-through" : ""}`}>
                  <td className="py-2 pr-3">{svc[r.service_slug]?.name ?? r.service_slug}</td><td className="py-2 pr-3 break-all">{r.email}</td><td className="py-2 pr-3">{r.postcode ?? "—"}</td>
                  <td className="py-2 pr-3">{r.marketing_opt_in ? "Yes" : "No"}</td><td className="py-2 whitespace-nowrap">{dateTime(r.created_at)}</td>
                </tr>))}</tbody>
            </table></div>
          ) : <Empty>No registrations match.</Empty>}
        </Panel>
      </div>
    </>
  );
}
