import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip, applicationStatusLabel } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import { dateTime, fullName } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { DecisionForm } from "../../DecisionForm";

export const metadata = { title: "Application" };
const PREF: Record<string, string> = { employed: "Employed", self_employed: "Self-employed", either: "Either", not_sure: "Not sure" };

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = (await supabaseServer())!;
  const { data: a } = await db.from("professional_applications").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();
  const [{ data: events }, { data: docs }, { data: services }] = await Promise.all([
    db.from("application_events").select("status, note, created_at, profiles(first_name, last_name)").eq("application_id", id).order("created_at"),
    db.from("professional_documents").select("*").eq("user_id", a.user_id).order("created_at"),
    db.from("services").select("slug, name, workforce").is("archived_at", null).order("sort_order"),
  ]);
  // Short-lived private links (10 minutes) so documents are never publicly accessible.
  const links = await Promise.all((docs ?? []).map(async (d) => ({ ...d, url: (await db.storage.from("professional-documents").createSignedUrl(d.file_path, 600)).data?.signedUrl })));
  const svcName = Object.fromEntries((services ?? []).map((s) => [s.slug, s.name]));
  type Ev = { status: string; note: string | null; created_at: string; profiles: { first_name: string; last_name: string } | null };
  return (
    <>
      <p className="mb-3 text-sm"><Link href="/admin/professionals" className="link font-normal">← Professionals</Link></p>
      <PageTitle title={fullName(a)} intro={`${a.email} · ${a.phone} · ${a.home_postcode}`} action={<StatusChip kind="application" status={a.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-6">
          <Panel title="Application">
            <dl className="grid gap-4 text-sm">
              <div><dt className="font-semibold">Services</dt><dd>{a.services.map((s: string) => svcName[s] ?? s).join(", ")}</dd></div>
              <div><dt className="font-semibold">Working preference</dt><dd>{PREF[a.employment_preference]}</dd></div>
              <div><dt className="font-semibold">Qualifications</dt><dd className="whitespace-pre-line">{a.qualifications || "—"}</dd></div>
              <div><dt className="font-semibold">Experience</dt><dd className="whitespace-pre-line">{a.experience}</dd></div>
              <div><dt className="font-semibold">Availability</dt><dd className="whitespace-pre-line">{a.availability}</dd></div>
              <div><dt className="font-semibold">Introduction</dt><dd className="whitespace-pre-line">{a.introduction}</dd></div>
              {a.applicant_response && <div><dt className="font-semibold">Applicant's response to your request</dt><dd className="whitespace-pre-line">{a.applicant_response}</dd></div>}
              <div><dt className="font-semibold">Consent given</dt><dd>{dateTime(a.consent_at)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Documents">
            {links.length ? (
              <ul className="grid gap-2 text-sm">{links.map((d) => <li key={d.id} className="flex justify-between gap-2"><span>{d.title} · {d.doc_type}</span>{d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="link">Open (link expires in 10 min)</a> : <span className="text-text-muted">Unavailable</span>}</li>)}</ul>
            ) : <p className="text-sm text-text-muted">No documents uploaded.</p>}
          </Panel>
        </div>
        <div className="grid content-start gap-6">
          {a.status !== "approved" && a.status !== "rejected" ? (
            <Panel title="Decision"><DecisionForm applicationId={a.id} applied={a.services} services={services ?? []} status={a.status} /></Panel>
          ) : <Panel title="Decision"><p className="text-sm">This application was <b>{applicationStatusLabel(a.status).toLowerCase()}</b>.</p></Panel>}
          <Panel title="Decision record">
            <ol className="grid gap-3 text-sm">
              {((events ?? []) as unknown as Ev[]).map((e, i) => <li key={i}><b>{applicationStatusLabel(e.status)}</b>{e.profiles ? ` by ${fullName(e.profiles)}` : ""}<br /><span className="text-text-muted">{dateTime(e.created_at)}</span>{e.note && <p className="mt-1 whitespace-pre-line">{e.note}</p>}</li>)}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
