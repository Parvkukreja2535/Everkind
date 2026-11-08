import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip, bookingStatusLabel } from "@/components/dashboard/StatusChip";
import { requireUser } from "@/lib/auth";
import { serviceNames, type BookingRow } from "@/lib/bookings";
import { dateLong, dateTime, money, timeShort } from "@/lib/format";
import { SITE } from "@/lib/site";
import { startsWithinHours } from "@/lib/booking";
import { supabaseServer } from "@/lib/supabase/server";
import { CancelForm } from "./CancelForm";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/account/bookings/${id}`);
  const supabase = (await supabaseServer())!;
  // RLS returns nothing unless this booking belongs to the signed-in customer.
  const { data } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const b = data as BookingRow;
  const [{ data: events }, names] = await Promise.all([
    supabase.from("booking_events").select("status, note, created_at").eq("booking_id", id).order("created_at"),
    serviceNames(supabase, [b.service_slug]),
  ]);
  const cancellable = ["requested", "finding_professional", "escalated", "confirmed"].includes(b.status);
  const within24h = startsWithinHours(b.requested_date, b.requested_time, 24);
  return (
    <>
      <p className="mb-3 text-sm"><Link href="/account/bookings" className="link font-normal">← My bookings</Link></p>
      <PageTitle title={names[b.service_slug] ?? b.price_description} intro={<>Reference <b className="tabular-nums text-text">{b.reference}</b></>} action={<StatusChip status={b.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Booking details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-text-muted">Service</dt><dd>{b.price_description}</dd>
            <dt className="text-text-muted">Date</dt><dd>{dateLong(b.requested_date)}</dd>
            <dt className="text-text-muted">Time</dt><dd>{timeShort(b.requested_time)}</dd>
            {b.arrival_window_start && <><dt className="text-text-muted">Estimated arrival</dt><dd>{dateTime(b.arrival_window_start)}{b.arrival_window_end ? ` – ${dateTime(b.arrival_window_end).split(", ")[1]}` : ""}</dd></>}
            <dt className="text-text-muted">Address</dt><dd>{b.address_line}, {b.postcode}</dd>
            {b.tasks?.length ? <><dt className="text-text-muted">Tasks</dt><dd>{b.tasks.join("; ")}</dd></> : null}
            {b.notes && <><dt className="text-text-muted">Notes</dt><dd>{b.notes}</dd></>}
            <dt className="text-text-muted">Price</dt><dd className="tabular-nums">{money(b.price_total_pence)}</dd>
            <dt className="text-text-muted">Professional</dt><dd>{b.assigned_worker_id ? "Assigned" : b.workforce === "contractor" ? "We're finding a vetted professional" : "We'll confirm your team member"}</dd>
          </dl>
          <p className="mt-4 text-xs text-text-muted">{SITE.noPayment} Arrival times are estimates and may change.</p>
          {cancellable && <div className="mt-5 border-t border-line pt-5"><CancelForm bookingId={b.id} within24h={within24h} /></div>}
        </Panel>
        <Panel title="Booking history">
          <ol className="grid gap-3">
            <li className="text-sm"><b>Booking sent</b><br /><span className="text-text-muted">{dateTime(b.created_at)}</span></li>
            {(events ?? []).map((e, i) => (
              <li key={i} className="text-sm"><b>{bookingStatusLabel(e.status)}</b>{e.note ? ` — ${e.note}` : ""}<br /><span className="text-text-muted">{dateTime(e.created_at)}</span></li>
            ))}
          </ol>
          {b.workforce === "contractor" && b.status === "finding_professional" && <div className="mt-4"><Notice>Your request is confirmed only once a vetted professional accepts it. We'll email you.</Notice></div>}
        </Panel>
      </div>
    </>
  );
}
