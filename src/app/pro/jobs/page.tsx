import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip, UPCOMING } from "@/components/dashboard/StatusChip";
import { getProfessional } from "@/lib/auth";
import { serviceNames, type BookingRow } from "@/lib/bookings";
import { dateLong, money, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { acceptJobAction, declineJobAction, updateJobStatusAction } from "../actions";

export const metadata: Metadata = { title: "Jobs" };
const NEXT: Record<string, [string, string]> = { confirmed: ["on_the_way", "I'm on my way"], on_the_way: ["arrived", "I've arrived"], arrived: ["in_progress", "Start job"], in_progress: ["completed", "Mark completed"] };
type Open = { id: string; reference: string; service_slug: string; option_slug: string | null; requested_date: string; requested_time: string | null; duration_minutes: number; postcode_district: string; notes: string | null; price_total_pence: number; offered: boolean };

export default async function ProJobs() {
  const { pro } = await getProfessional();
  if (!pro) redirect("/pro");
  const db = (await supabaseServer())!;
  const [{ data: assigned }, { data: completed }, open] = await Promise.all([
    db.from("bookings").select("*").eq("assigned_worker_id", pro.id).in("status", UPCOMING).order("requested_date").order("requested_time"),
    db.from("bookings").select("*").eq("assigned_worker_id", pro.id).eq("status", "completed").order("requested_date", { ascending: false }).limit(20),
    pro.worker_type === "contractor" ? db.rpc("open_requests_for_me") : Promise.resolve({ data: [] as Open[] }),
  ]);
  const up = (assigned ?? []) as BookingRow[];
  const past = (completed ?? []) as BookingRow[];
  const requests = (open.data ?? []) as Open[];
  const names = await serviceNames(db, [...up, ...past, ...requests].map((b) => b.service_slug));

  return (
    <>
      <PageTitle title={pro.worker_type === "contractor" ? "Jobs & requests" : "My schedule"} intro={pro.worker_type === "contractor" ? "Accept the requests you want to take. A booking is confirmed for the customer only once you accept." : "Jobs assigned to you by Everkind."} />
      <div className="grid gap-6">
        {pro.worker_type === "contractor" && (
          <Panel title={`Job requests (${requests.length})`}>
            <p className="mb-3 text-sm text-text-muted">The customer's name and full address are shared once you accept. The first eligible professional to accept gets the job.</p>
            {requests.length ? (
              <ul className="grid gap-3">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-ctl border border-line p-4">
                    <div className="text-sm">
                      <b className="text-[15px]">{names[r.service_slug] ?? r.service_slug}</b>{r.offered && <span className="ml-2 rounded-full bg-green-tint px-2 py-0.5 text-xs font-semibold text-green">Offered to you</span>}<br />
                      {dateLong(r.requested_date)} · {timeShort(r.requested_time)} · about {Math.round(r.duration_minutes / 60 * 10) / 10}h · {r.postcode_district} area · {money(r.price_total_pence)} job value
                      {r.notes && <p className="mt-1 text-text-muted">“{r.notes}”</p>}
                    </div>
                    <div className="flex gap-2">
                      <form action={acceptJobAction}><input type="hidden" name="id" value={r.id} /><button className="btn-primary btn-sm">Accept</button></form>
                      <form action={declineJobAction}><input type="hidden" name="id" value={r.id} /><button className="btn-secondary btn-sm">Decline</button></form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Empty>No open requests for your services right now.</Empty>}
          </Panel>
        )}
        <Panel title="Upcoming appointments">
          {up.length ? (
            <ul className="grid gap-3">
              {up.map((b) => (
                <li key={b.id} className="rounded-ctl border border-line p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><b className="text-[15px]">{names[b.service_slug] ?? b.price_description}</b> <span className="text-text-muted">· {b.reference}</span><br />{dateLong(b.requested_date)} · {timeShort(b.requested_time)} · {b.price_description}</div>
                    <StatusChip status={b.status} />
                  </div>
                  <p className="mt-2"><b>{b.customer_name}</b> · {b.customer_phone}<br />{b.address_line}, {b.postcode}</p>
                  {b.tasks?.length ? <p className="mt-1 text-text-muted">Tasks (priority order): {b.tasks.join("; ")}</p> : null}
                  {b.notes && <p className="mt-1 text-text-muted">Notes: {b.notes}</p>}
                  {NEXT[b.status] && (
                    <form action={updateJobStatusAction} className="mt-3"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value={NEXT[b.status][0]} /><button className="btn-primary btn-sm">{NEXT[b.status][1]}</button></form>
                  )}
                </li>
              ))}
            </ul>
          ) : <Empty>No upcoming appointments.</Empty>}
          <div className="mt-3"><Notice>Arrival times are shared with customers as estimates. Everkind doesn't track your location.</Notice></div>
        </Panel>
        <Panel title="Completed work">
          {past.length ? (
            <ul className="divide-y divide-line text-sm">{past.map((b) => <li key={b.id} className="flex justify-between gap-2 py-2"><span>{names[b.service_slug] ?? b.price_description} · {b.reference}</span><span className="text-text-muted">{dateLong(b.requested_date)}</span></li>)}</ul>
          ) : <Empty>Completed jobs will appear here.</Empty>}
        </Panel>
      </div>
    </>
  );
}
