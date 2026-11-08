import Link from "next/link";
import { PageTitle, Panel } from "@/components/dashboard/Shell";
import { AvailabilityChip } from "@/components/AvailabilityChip";
import { requireAdmin } from "@/lib/auth";
import type { Availability } from "@/lib/catalogue";
import { money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { QuickPrice } from "./QuickPrice";

export const metadata = { title: "Pricing" };
const MODEL: Record<string, string> = { fixed: "Fixed", hourly: "Hourly", first_hour: "First hour + extra", from: "Starting price", callout: "Callout fee", not_priced: "Not priced" };

export default async function AdminPricing() {
  await requireAdmin();
  const db = (await supabaseServer())!;
  const { data } = await db.from("services").select("id, slug, name, availability, price_type, price_pence, price_note, min_hours, hours_options, extra_hour_pence, categories(name, sort_order), service_options(id, name, price_type, price_pence, min_hours)").is("archived_at", null).order("sort_order");
  type Row = { id: string; slug: string; name: string; availability: Availability; price_type: string; price_pence: number | null; price_note: string; min_hours: number | null; hours_options: number[] | null; extra_hour_pence: number | null; categories: { name: string; sort_order: number } | null; service_options: { id: string; name: string; price_type: string; price_pence: number; min_hours: number | null }[] };
  const rows = ((data ?? []) as unknown as Row[]).sort((a, b) => (a.categories?.sort_order ?? 0) - (b.categories?.sort_order ?? 0));
  const instant = rows.find((r) => r.slug === "instant-clean");
  const rest = rows.filter((r) => r.slug !== "instant-clean");

  return (
    <>
      <PageTitle title="Pricing" intro="All prices are what customers pay. Changes go live on the website and in new bookings immediately; existing bookings keep the price they were booked at." />
      {instant && (
        <Panel title="Instant Clean: hourly rate" className="mb-6">
          <p className="mb-4 text-sm text-text-muted">Billed by the hour. The total is the hourly rate × hours chosen, shown to the customer before they confirm.</p>
          <QuickPrice compact={false} id={instant.id} pricePence={instant.price_pence} priceType={instant.price_type} minHours={instant.min_hours} hoursOptions={instant.hours_options} extraHourPence={null} />
        </Panel>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="p-3">Service</th><th className="p-3">Label</th><th className="p-3">Model</th><th className="p-3">Current</th><th className="p-3">Change price</th></tr></thead>
          <tbody>
            {rest.map((r) => (
              <tr key={r.id} className="border-b border-line align-top last:border-0">
                <td className="p-3"><Link href={`/admin/services/${r.id}`} className="font-semibold hover:text-green">{r.name}</Link><br /><span className="text-xs text-text-muted">{r.categories?.name}</span>
                  {r.service_options.length > 0 && <ul className="mt-1 text-xs text-text-muted">{r.service_options.map((o) => <li key={o.id}>Option: {o.name} · {money(o.price_pence)}{o.price_type === "hourly" ? "/hr" : ""} <Link href={`/admin/services/${r.id}`} className="link">edit</Link></li>)}</ul>}
                </td>
                <td className="p-3"><AvailabilityChip availability={r.availability} /></td>
                <td className="p-3">{MODEL[r.price_type]}{r.min_hours ? ` · min ${r.min_hours}h` : ""}</td>
                <td className="p-3 tabular-nums">{r.price_pence == null ? "—" : `${money(r.price_pence)}${r.price_type === "hourly" ? "/hr" : ""}`}</td>
                <td className="p-3">{r.price_type === "not_priced" ? <span className="text-text-muted">Set a pricing model first</span> : <QuickPrice id={r.id} pricePence={r.price_pence} priceType={r.price_type} minHours={r.min_hours} hoursOptions={r.hours_options} extraHourPence={r.extra_hour_pence} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
