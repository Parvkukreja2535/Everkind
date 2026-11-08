import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { getProfessional } from "@/lib/auth";
import { dateLong, fullName } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { DetailsForm } from "@/app/account/profile/ProfileForms";
import { BioForm, DocumentForm } from "../ProForms";

export const metadata: Metadata = { title: "Profile & documents" };
const DOC_LABEL: Record<string, string> = { cv: "CV", qualification: "Qualification", insurance: "Insurance", id: "Photo ID", right_to_work: "Right to work", dbs: "DBS", other: "Other" };

export default async function ProProfile() {
  const { pro, session } = await getProfessional();
  if (!pro) redirect("/pro");
  const db = (await supabaseServer())!;
  const [{ data: svc }, { data: docs }] = await Promise.all([
    db.from("professional_services").select("services(name, workforce)").eq("professional_id", pro.id),
    db.from("professional_documents").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
  ]);
  const services = ((svc ?? []) as unknown as { services: { name: string } | null }[]).map((r) => r.services?.name).filter(Boolean);
  return (
    <>
      <PageTitle title="Profile & documents" intro={`${fullName(session.profile)} · ${session.user.email}`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Personal details"><DetailsForm first={session.profile.first_name} last={session.profile.last_name} phone={session.profile.phone} /></Panel>
        <Panel title="How you work with Everkind">
          {pro.worker_type === "contractor" ? (
            <Notice><b>Independent contractor.</b> You're self-employed and choose which job requests to accept. You're not an Everkind employee, and you're responsible for your own tax and insurance.</Notice>
          ) : (
            <Notice tone="ok"><b>Everkind team member.</b> You're employed by Everkind, and your jobs are scheduled and assigned by Everkind.</Notice>
          )}
          <h3 className="mb-2 mt-5 text-sm font-semibold">Approved services</h3>
          {services.length ? <ul className="grid gap-1 text-sm">{services.map((n) => <li key={n}>• {n}</li>)}</ul> : <Empty>No services approved yet.</Empty>}
          <p className="mt-3 text-xs text-text-muted">To change your services or working arrangement, contact the Everkind team.</p>
          <div className="mt-5"><BioForm bio={pro.bio} /></div>
        </Panel>
        <Panel title="Qualifications and documents" className="xl:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              {docs?.length ? (
                <ul className="grid gap-2 text-sm">
                  {docs.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ctl border border-line px-3 py-2">
                      <span><b>{d.title}</b> · {DOC_LABEL[d.doc_type]}{d.expires_on ? ` · expires ${dateLong(d.expires_on)}` : ""}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.verified ? "bg-green-tint text-status-ok" : "bg-amber-tint text-status-warn"}`}>{d.verified ? "Verified" : "Awaiting check"}</span>
                    </li>
                  ))}
                </ul>
              ) : <Empty>No documents uploaded yet.</Empty>}
            </div>
            <DocumentForm />
          </div>
        </Panel>
      </div>
    </>
  );
}
