import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import { dateLong, fullName, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { setProfessionalStatusAction, verifyDocumentAction } from "../../actions";
import { ProServicesForm } from "../DecisionForm";

export const metadata = { title: "Professional" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function ProfessionalDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = (await supabaseServer())!;
  const { data: p } = await db.from("professionals").select("*, profiles!professionals_user_id_fkey(first_name, last_name, email, phone)").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: ps }, { data: services }, { data: slots }, { data: docs }, { data: jobs }] = await Promise.all([
    db.from("professional_services").select("services(slug)").eq("professional_id", id),
    db.from("services").select("slug, name, workforce").is("archived_at", null).order("sort_order"),
    db.from("professional_availability").select("*").eq("professional_id", id).order("weekday"),
    db.from("professional_documents").select("*").eq("user_id", p.user_id).order("created_at"),
    db.from("bookings").select("id, reference, service_slug, requested_date, requested_time, status").eq("assigned_worker_id", id).order("requested_date", { ascending: false }).limit(20),
  ]);
  const selected = ((ps ?? []) as unknown as { services: { slug: string } | null }[]).map((r) => r.services?.slug ?? "");
  const prof = p.profiles as { first_name: string; last_name: string; email: string; phone: string };
  const links = await Promise.all((docs ?? []).map(async (d) => ({ ...d, url: (await db.storage.from("professional-documents").createSignedUrl(d.file_path, 600)).data?.signedUrl })));
  return (
    <>
      <p className="mb-3 text-sm"><Link href="/admin/professionals" className="link font-normal">← Professionals</Link></p>
      <PageTitle title={fullName(prof)} intro={`${prof.email} · ${prof.phone} · ${p.worker_type === "employed" ? "Everkind employee" : "Independent contractor"}`} action={
        <form action={setProfessionalStatusAction} className="flex items-center gap-3"><StatusChip kind="account" status={p.status} /><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={p.status === "active" ? "suspended" : "active"} /><button className="btn-secondary btn-sm">{p.status === "active" ? "Suspend" : "Reactivate"}</button></form>} />
      {p.status === "suspended" && <div className="mb-4"><Notice tone="err">Suspended: this professional can't see or accept any jobs.</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Approved services"><ProServicesForm proId={p.id} services={services ?? []} selected={selected} workerType={p.worker_type} /></Panel>
        <div className="grid content-start gap-6">
          <Panel title="Availability">{slots?.length ? <ul className="grid gap-1 text-sm">{slots.map((s) => <li key={s.id}>{DAYS[s.weekday]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</li>)}</ul> : <Empty>No hours set.</Empty>}</Panel>
          <Panel title="Documents">
            {links.length ? <ul className="grid gap-2 text-sm">{links.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{d.title} · {d.doc_type}{d.expires_on ? ` · expires ${dateLong(d.expires_on)}` : ""}</span>
                <span className="flex items-center gap-3">{d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="link">Open</a>}
                  <form action={verifyDocumentAction}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="verified" value={String(!d.verified)} /><button className={d.verified ? "text-status-ok" : "link"}>{d.verified ? "Verified ✓" : "Mark verified"}</button></form></span>
              </li>))}</ul> : <Empty>No documents.</Empty>}
          </Panel>
        </div>
        <Panel title="Recent jobs" className="xl:col-span-2">
          {jobs?.length ? <ul className="grid gap-1 text-sm">{jobs.map((j) => <li key={j.id} className="flex flex-wrap justify-between gap-2"><Link href={`/admin/bookings/${j.id}`} className="hover:text-green">{j.reference} · {j.service_slug}</Link><span>{dateLong(j.requested_date)} {timeShort(j.requested_time)} <StatusChip status={j.status} /></span></li>)}</ul> : <Empty>No jobs yet.</Empty>}
        </Panel>
      </div>
    </>
  );
}
