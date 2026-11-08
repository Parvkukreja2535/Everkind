import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import { dateLong, dateTime, fullName, money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { setAccountStatusAction } from "../../actions";

export const metadata = { title: "Customer" };

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { session } = { session: await requireAdmin() };
  const { id } = await params;
  const db = (await supabaseServer())!;
  const { data: p } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: addresses }, { data: bookings }] = await Promise.all([
    db.from("customer_addresses").select("*").eq("user_id", id),
    db.from("bookings").select("id, reference, service_slug, requested_date, status, price_total_pence").eq("customer_id", id).order("requested_date", { ascending: false }),
  ]);
  const self = id === session.user.id;
  return (
    <>
      <p className="mb-3 text-sm"><Link href="/admin/customers" className="link font-normal">← Customers</Link></p>
      <PageTitle title={fullName(p)} intro={`${p.role === "customer" ? "Customer" : p.role === "professional" ? "Professional" : "Admin"} account · joined ${dateTime(p.created_at).split(",")[0]}`} action={!self && (
        <form action={setAccountStatusAction} className="flex items-center gap-3"><StatusChip kind="account" status={p.status} /><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={p.status === "active" ? "suspended" : "active"} /><button className="btn-secondary btn-sm">{p.status === "active" ? "Suspend account" : "Reactivate account"}</button></form>)} />
      {p.status === "suspended" && <div className="mb-4"><Notice tone="err">Suspended: this person can't log in or book.</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Contact details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-text-muted">Email</dt><dd className="break-all">{p.email}</dd>
            <dt className="text-text-muted">Phone</dt><dd>{p.phone || "—"}</dd>
          </dl>
          <h3 className="mb-2 mt-5 text-sm font-semibold">Saved addresses</h3>
          {addresses?.length ? <ul className="grid gap-1 text-sm">{addresses.map((a) => <li key={a.id}>{a.label}: {a.line1}, {a.postcode}</li>)}</ul> : <p className="text-sm text-text-muted">None.</p>}
        </Panel>
        <Panel title={`Booking history (${bookings?.length ?? 0})`}>
          {bookings?.length ? <ul className="divide-y divide-line text-sm">{bookings.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><Link href={`/admin/bookings/${b.id}`} className="hover:text-green">{b.reference} · {b.service_slug}</Link><span className="flex items-center gap-3">{dateLong(b.requested_date)} · {money(b.price_total_pence)} <StatusChip status={b.status} /></span></li>
          ))}</ul> : <Empty>No bookings yet.</Empty>}
        </Panel>
      </div>
    </>
  );
}
