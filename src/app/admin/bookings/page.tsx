import Link from "next/link";
import { Empty, PageTitle } from "@/components/dashboard/Shell";
import { CANCELLED, StatusChip, UPCOMING } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import type { BookingRow } from "@/lib/bookings";
import { dateLong, money, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Bookings" };

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ service?: string; from?: string; to?: string; customer?: string; pro?: string; status?: string; type?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = (await supabaseServer())!;
  const [{ data: services }, { data: pros }] = await Promise.all([
    db.from("services").select("slug, name").order("name"),
    db.from("professionals").select("id, profiles!professionals_user_id_fkey(first_name, last_name)"),
  ]);
  let q = db.from("bookings").select("*");
  if (sp.service) q = q.eq("service_slug", sp.service);
  if (sp.from) q = q.gte("requested_date", sp.from);
  if (sp.to) q = q.lte("requested_date", sp.to);
  if (sp.pro) q = sp.pro === "none" ? q.is("assigned_worker_id", null) : q.eq("assigned_worker_id", sp.pro);
  if (sp.type) q = q.eq("workforce", sp.type as "employed" | "contractor");
  if (sp.customer) { const t = sp.customer.replace(/[%_,()]/g, ""); q = q.or(`customer_email.ilike.%${t}%,customer_name.ilike.%${t}%,reference.ilike.%${t}%`); }
  if (sp.status === "open") q = q.in("status", ["requested", "finding_professional", "escalated"]);
  else if (sp.status === "upcoming") q = q.in("status", UPCOMING);
  else if (sp.status === "cancelled") q = q.in("status", CANCELLED);
  else if (sp.status) q = q.eq("status", sp.status as "completed");
  const { data } = await q.order("requested_date", { ascending: false }).order("requested_time").limit(300);
  const list = (data ?? []) as BookingRow[];
  const svcName = Object.fromEntries((services ?? []).map((s) => [s.slug, s.name]));
  type Pro = { id: string; profiles: { first_name: string; last_name: string } | null };
  const proName = Object.fromEntries(((pros ?? []) as unknown as Pro[]).map((p) => [p.id, [p.profiles?.first_name, p.profiles?.last_name].filter(Boolean).join(" ")]));
  return (
    <>
      <PageTitle title="Bookings" intro="Employed-service bookings are confirmed when you assign a team member. Contractor requests are confirmed only when a contractor accepts." />
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.3fr_1fr_.8fr_.8fr_1fr_1fr_.8fr_auto]">
        <input name="customer" defaultValue={sp.customer} placeholder="Customer, email or ref" aria-label="Customer" className="input" />
        <select name="service" defaultValue={sp.service ?? ""} aria-label="Service" className="input"><option value="">All services</option>{(services ?? []).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from} aria-label="From date" className="input" />
        <input type="date" name="to" defaultValue={sp.to} aria-label="To date" className="input" />
        <select name="pro" defaultValue={sp.pro ?? ""} aria-label="Professional" className="input"><option value="">Any professional</option><option value="none">Unassigned</option>{Object.entries(proName).map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="input"><option value="">Any status</option><option value="open">Needs a professional</option><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        <select name="type" defaultValue={sp.type ?? ""} aria-label="Type" className="input"><option value="">All types</option><option value="employed">Employed</option><option value="contractor">Contractor</option></select>
        <button className="btn-secondary">Filter</button>
      </form>
      {list.length ? (
        <div className="card overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="p-3">When</th><th className="p-3">Service</th><th className="p-3">Customer</th><th className="p-3">Professional</th><th className="p-3">Type</th><th className="p-3">Price</th><th className="p-3">Status</th></tr></thead>
          <tbody>{list.map((b) => (
            <tr key={b.id} className="border-b border-line last:border-0 hover:bg-surface">
              <td className="p-3 whitespace-nowrap">{dateLong(b.requested_date)}<br /><span className="text-text-muted">{timeShort(b.requested_time)}</span></td>
              <td className="p-3"><Link href={`/admin/bookings/${b.id}`} className="font-semibold hover:text-green">{svcName[b.service_slug] ?? b.service_slug}</Link><br /><span className="text-text-muted tabular-nums">{b.reference}</span></td>
              <td className="p-3">{b.customer_name}<br /><span className="text-text-muted">{b.postcode}</span></td>
              <td className="p-3">{b.assigned_worker_id ? proName[b.assigned_worker_id] ?? "Assigned" : <span className="text-status-warn">Unassigned</span>}</td>
              <td className="p-3">{b.workforce === "contractor" ? "Contractor" : "Employed"}</td>
              <td className="p-3 tabular-nums">{money(b.price_total_pence)}</td>
              <td className="p-3"><StatusChip status={b.status} /></td>
            </tr>))}</tbody>
        </table></div>
      ) : <Empty>No bookings match these filters.</Empty>}
    </>
  );
}
