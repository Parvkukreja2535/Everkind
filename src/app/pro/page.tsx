import type { Metadata } from "next";
import Link from "next/link";
import { Empty, Notice, PageTitle, Panel, Stat } from "@/components/dashboard/Shell";
import { StatusChip, UPCOMING, applicationStatusLabel } from "@/components/dashboard/StatusChip";
import { getProfessional } from "@/lib/auth";
import { serviceNames, type BookingRow } from "@/lib/bookings";
import { dateLong, dateTime, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { RespondForm } from "./ProForms";

export const metadata: Metadata = { title: "Professional portal" };

export default async function ProHome() {
  const { session, pro } = await getProfessional();
  const db = (await supabaseServer())!;

  if (!pro) {
    const { data: app } = await db.from("professional_applications").select("*").eq("user_id", session.user.id).maybeSingle();
    const { data: events } = app ? await db.from("application_events").select("status, note, created_at").eq("application_id", app.id).order("created_at") : { data: [] };
    const { data: suspended } = await db.from("professionals").select("status").eq("user_id", session.user.id).maybeSingle();
    return (
      <>
        <PageTitle title="Your application" intro="Applications are reviewed by the Everkind team. Professional tools open once you're approved." />
        {suspended?.status === "suspended" && <div className="mb-4"><Notice tone="err">Your professional access is currently suspended. Please contact us.</Notice></div>}
        {!app ? (
          <Empty>You haven't applied yet. <Link href="/work-with-everkind" className="link">Apply to work with Everkind</Link></Empty>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <Panel title="Status" action={<StatusChip kind="application" status={app.status} />}>
              <p className="text-[15px]">
                {app.status === "submitted" && "We've received your application and will review it soon."}
                {app.status === "under_review" && "Our team is reviewing your application."}
                {app.status === "info_required" && "We need a little more information before we can continue."}
                {app.status === "approved" && "Your application has been approved. Your professional access is being set up."}
                {app.status === "rejected" && "Thank you for applying. We're unable to offer work at the moment."}
              </p>
              {app.status === "info_required" && (
                <div className="mt-4 grid gap-4">
                  <Notice tone="warn"><b>From the Everkind team:</b> {app.info_request}</Notice>
                  <RespondForm />
                  <p className="text-sm text-text-muted">Need to send documents? Email them to us and mention your name.</p>
                </div>
              )}
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-text-muted">Submitted</dt><dd>{dateTime(app.created_at)}</dd>
                <dt className="text-text-muted">Services</dt><dd>{app.services.length} selected</dd>
                <dt className="text-text-muted">CV</dt><dd>{app.cv_path ? "Uploaded" : "Not provided"}</dd>
              </dl>
            </Panel>
            <Panel title="History">
              <ol className="grid gap-3 text-sm">
                {(events ?? []).map((e, i) => <li key={i}><b>{applicationStatusLabel(e.status)}</b>{e.note && e.status !== "rejected" ? ` — ${e.note}` : ""}<br /><span className="text-text-muted">{dateTime(e.created_at)}</span></li>)}
              </ol>
            </Panel>
          </div>
        )}
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: jobs }, { data: svc }, open] = await Promise.all([
    db.from("bookings").select("*").eq("assigned_worker_id", pro.id).in("status", UPCOMING).gte("requested_date", today).order("requested_date").limit(5),
    db.from("professional_services").select("services(name)").eq("professional_id", pro.id),
    pro.worker_type === "contractor" ? db.rpc("open_requests_for_me") : Promise.resolve({ data: [] }),
  ]);
  const list = (jobs ?? []) as BookingRow[];
  const names = await serviceNames(db, list.map((b) => b.service_slug));
  const approved = ((svc ?? []) as unknown as { services: { name: string } | null }[]).map((r) => r.services?.name).filter(Boolean);
  return (
    <>
      <PageTitle title={`Hello, ${session.profile.first_name || "there"}`} intro={pro.worker_type === "contractor"
        ? "You work with Everkind as an independent, self-employed contractor. You choose which job requests to accept; you're not an Everkind employee."
        : "You're part of the Everkind team. Your jobs are scheduled and assigned by Everkind."} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Upcoming jobs" value={list.length} />
        {pro.worker_type === "contractor" && <Stat label="Open job requests" value={(open.data ?? []).length} />}
        <Stat label="Approved services" value={approved.length} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Upcoming appointments" action={<Link href="/pro/jobs" className="link text-sm">All jobs</Link>}>
          {list.length ? (
            <ul className="divide-y divide-line text-sm">
              {list.map((b) => <li key={b.id} className="flex flex-wrap justify-between gap-2 py-3"><span><b>{names[b.service_slug] ?? b.price_description}</b><br /><span className="text-text-muted">{dateLong(b.requested_date)} · {timeShort(b.requested_time)} · {b.postcode}</span></span><StatusChip status={b.status} /></li>)}
            </ul>
          ) : <Empty>No upcoming jobs.{pro.worker_type === "contractor" ? " Check your job requests." : " Everkind will assign jobs to you."}</Empty>}
        </Panel>
        <Panel title="Approved services">
          {approved.length ? <ul className="grid gap-1 text-sm">{approved.map((n) => <li key={n}>• {n}</li>)}</ul> : <Empty>No services approved yet.</Empty>}
        </Panel>
      </div>
    </>
  );
}
