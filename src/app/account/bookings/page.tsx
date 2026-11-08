import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageTitle } from "@/components/dashboard/Shell";
import { CANCELLED, StatusChip, UPCOMING } from "@/components/dashboard/StatusChip";
import { requireUser } from "@/lib/auth";
import { serviceNames, type BookingRow } from "@/lib/bookings";
import { dateLong, money, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My bookings" };
const TABS = { upcoming: "Upcoming", completed: "Completed", cancelled: "Cancelled" } as const;

export default async function MyBookings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser("/account/bookings");
  const tab = ((await searchParams).tab ?? "upcoming") as keyof typeof TABS;
  const supabase = (await supabaseServer())!;
  let q = supabase.from("bookings").select("*");
  q = tab === "completed" ? q.eq("status", "completed") : tab === "cancelled" ? q.in("status", CANCELLED) : q.in("status", UPCOMING);
  const { data } = await q.order("requested_date", { ascending: tab === "upcoming" }).limit(100);
  const list = (data ?? []) as BookingRow[];
  const names = await serviceNames(supabase, list.map((b) => b.service_slug));
  return (
    <>
      <PageTitle title="My bookings" action={<Link href="/services" className="btn-primary">Book a service</Link>} />
      <div role="tablist" className="mb-4 flex gap-2">
        {(Object.keys(TABS) as (keyof typeof TABS)[]).map((t) => (
          <Link key={t} role="tab" aria-selected={t === tab} href={`/account/bookings?tab=${t}`} className={`rounded-full border px-4 py-1.5 text-sm ${t === tab ? "border-green bg-green text-white" : "border-line bg-white hover:border-green"}`}>{TABS[t]}</Link>
        ))}
      </div>
      {list.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="p-3">Service</th><th className="p-3">When</th><th className="p-3">Reference</th><th className="p-3">Price</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0 hover:bg-surface">
                  <td className="p-3"><Link href={`/account/bookings/${b.id}`} className="font-semibold hover:text-green">{names[b.service_slug] ?? b.price_description}</Link></td>
                  <td className="whitespace-nowrap p-3">{dateLong(b.requested_date)} · {timeShort(b.requested_time)}</td>
                  <td className="p-3 tabular-nums">{b.reference}</td>
                  <td className="p-3 tabular-nums">{money(b.price_total_pence)}</td>
                  <td className="p-3"><StatusChip status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>No {TABS[tab].toLowerCase()} bookings.</Empty>}
    </>
  );
}
