import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip, bookingStatusLabel } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import type { BookingRow } from "@/lib/bookings";
import { dateLong, dateTime, fullName, money, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { unassignBookingAction } from "../../actions";
import { AdminCancelForm, AssignForm } from "../BookingAdminForms";

export const metadata = { title: "Booking" };
const CLOSED = ["completed", "cancelled_by_customer", "cancelled_by_everkind", "not_fulfilled"];

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = (await supabaseServer())!;
  const { data } = await db.from("bookings").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const b = data as BookingRow;
  const contractor = b.workforce === "contractor";
  const [{ data: events }, { data: assigns }, { data: eligible }, { data: svc }] = await Promise.all([
    db.from("booking_events").select("status, note, created_at").eq("booking_id", id).order("created_at"),
    db.from("booking_assignments").select("action, created_at, professionals(profiles!professionals_user_id_fkey(first_name, last_name))").eq("booking_id", id).order("created_at"),
    db.from("professional_services").select("professionals!inner(id, worker_type, status, profiles!professionals_user_id_fkey(first_name, last_name)), services!inner(slug)").eq("services.slug", b.service_slug),
    db.from("services").select("name").eq("slug", b.service_slug).maybeSingle(),
  ]);
  type Elig = { professionals: { id: string; worker_type: string; status: string; profiles: { first_name: string; last_name: string } | null } };
  // Keep the distinction: employed bookings go to employees, contractor bookings to contractors.
  const options = ((eligible ?? []) as unknown as Elig[]).map((e) => e.professionals)
    .filter((p) => p.status === "active" && p.worker_type === (contractor ? "contractor" : "employed") && p.id !== b.assigned_worker_id)
    .map((p) => ({ id: p.id, name: p.profiles ? fullName(p.profiles) : p.id }));
  type As = { action: string; created_at: string; professionals: { profiles: { first_name: string; last_name: string } | null } | null };
  const closed = CLOSED.includes(b.status);
  return (
    <>
      <p className="mb-3 text-sm"><Link href="/admin/bookings" className="link font-normal">← Bookings</Link></p>
      <PageTitle title={svc?.name ?? b.service_slug} intro={<><b className="tabular-nums text-text">{b.reference}</b> · {contractor ? "Contractor request" : "Employed service"} · booked {dateTime(b.created_at)}</>} action={<StatusChip status={b.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Details">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-text-muted">Service</dt><dd>{b.price_description}</dd>
              <dt className="text-text-muted">When</dt><dd>{dateLong(b.requested_date)} · {timeShort(b.requested_time)} · about {Math.round(b.duration_minutes / 6) / 10}h</dd>
              {b.arrival_window_start && <><dt className="text-text-muted">Arrival window</dt><dd>{dateTime(b.arrival_window_start)} – {b.arrival_window_end ? dateTime(b.arrival_window_end).split(", ")[1] : ""}</dd></>}
              <dt className="text-text-muted">Customer</dt><dd>{b.customer_id ? <Link href={`/admin/customers/${b.customer_id}`} className="link font-normal">{b.customer_name}</Link> : b.customer_name}<br />{b.customer_email} · {b.customer_phone}</dd>
              <dt className="text-text-muted">Address</dt><dd>{b.address_line}, {b.postcode}</dd>
              {b.tasks?.length ? <><dt className="text-text-muted">Tasks</dt><dd>{b.tasks.join("; ")}</dd></> : null}
              {b.notes && <><dt className="text-text-muted">Notes</dt><dd>{b.notes}</dd></>}
              <dt className="text-text-muted">Price</dt><dd className="tabular-nums">{money(b.price_total_pence)} <span className="text-text-muted">(no payment taken)</span></dd>
              {b.cancellation_reason && <><dt className="text-text-muted">Cancellation</dt><dd>{b.cancellation_reason}</dd></>}
            </dl>
          </Panel>
          <Panel title="History">
            <ol className="grid gap-2 text-sm">
              <li><b>Booking sent</b> · <span className="text-text-muted">{dateTime(b.created_at)}</span></li>
              {(events ?? []).map((e, i) => <li key={`e${i}`}><b>{bookingStatusLabel(e.status)}</b>{e.note ? ` — ${e.note}` : ""} · <span className="text-text-muted">{dateTime(e.created_at)}</span></li>)}
              {((assigns ?? []) as unknown as As[]).map((a, i) => <li key={`a${i}`}><b className="capitalize">{a.action}</b> {a.professionals?.profiles ? fullName(a.professionals.profiles) : ""} · <span className="text-text-muted">{dateTime(a.created_at)}</span></li>)}
            </ol>
          </Panel>
        </div>
        <div className="grid content-start gap-6">
          {!closed && (
            <Panel title={contractor ? "Offer to a contractor" : b.assigned_worker_id ? "Reassign" : "Assign a team member"}>
              {contractor && !b.assigned_worker_id && <div className="mb-3"><Notice>Not confirmed until a contractor accepts.</Notice></div>}
              {(!contractor || !b.assigned_worker_id) && <AssignForm bookingId={b.id} contractor={contractor} options={options} />}
              {b.assigned_worker_id && (
                <form action={unassignBookingAction} className="mt-4"><input type="hidden" name="id" value={b.id} /><button className="btn-secondary btn-sm">Remove current professional</button></form>
              )}
            </Panel>
          )}
          {!closed && <Panel title="Cancel booking"><AdminCancelForm bookingId={b.id} /></Panel>}
        </div>
      </div>
    </>
  );
}
