import Link from "next/link";
import { Empty, PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import { dateTime, fullName } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Professionals" };
const TABS = { pending: "Pending review", approved: "Approved", rejected: "Rejected", all: "All applications" } as const;

export default async function AdminProfessionals({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = (sp.tab ?? "pending") as keyof typeof TABS;
  const db = (await supabaseServer())!;
  let q = db.from("professional_applications").select("id, first_name, last_name, email, home_postcode, services, status, employment_preference, created_at");
  if (tab === "pending") q = q.in("status", ["submitted", "under_review", "info_required"]);
  if (tab === "approved") q = q.eq("status", "approved");
  if (tab === "rejected") q = q.eq("status", "rejected");
  if (sp.q) q = q.or(`email.ilike.%${sp.q.replace(/[%_,()]/g, "")}%,last_name.ilike.%${sp.q.replace(/[%_,()]/g, "")}%`);
  const [{ data: apps }, { data: pros }] = await Promise.all([
    q.order("created_at", { ascending: false }).limit(200),
    db.from("professionals").select("id, worker_type, status, approved_at, profiles!professionals_user_id_fkey(first_name, last_name, email)").order("approved_at", { ascending: false }),
  ]);
  type Pro = { id: string; worker_type: string; status: string; approved_at: string; profiles: { first_name: string; last_name: string; email: string } | null };
  return (
    <>
      <PageTitle title="Professionals" intro="Review applications and manage approved professionals. Every decision is recorded." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">{(Object.keys(TABS) as (keyof typeof TABS)[]).map((t) => <Link key={t} href={`/admin/professionals?tab=${t}`} className={`rounded-full border px-4 py-1.5 text-sm ${t === tab ? "border-green bg-green text-white" : "border-line bg-white"}`}>{TABS[t]}</Link>)}</div>
        <form><input type="hidden" name="tab" value={tab} /><input name="q" defaultValue={sp.q} placeholder="Search name or email" aria-label="Search applications" className="input h-9 w-64" /></form>
      </div>
      <div className="grid gap-6">
        <Panel title={`Applications · ${TABS[tab]}`}>
          {apps?.length ? (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="py-2 pr-3">Applicant</th><th className="py-2 pr-3">Services</th><th className="py-2 pr-3">Postcode</th><th className="py-2 pr-3">Submitted</th><th className="py-2">Status</th></tr></thead>
              <tbody>{apps.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3"><Link href={`/admin/professionals/applications/${a.id}`} className="font-semibold hover:text-green">{fullName(a)}</Link><br /><span className="text-text-muted">{a.email}</span></td>
                  <td className="py-2 pr-3">{a.services.length}</td><td className="py-2 pr-3">{a.home_postcode}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{dateTime(a.created_at)}</td><td className="py-2"><StatusChip kind="application" status={a.status} /></td>
                </tr>))}</tbody>
            </table></div>
          ) : <Empty>No applications here.</Empty>}
        </Panel>
        <Panel title={`Approved professionals (${pros?.length ?? 0})`}>
          {pros?.length ? (
            <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>
              {(pros as unknown as Pro[]).map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3"><Link href={`/admin/professionals/${p.id}`} className="font-semibold hover:text-green">{p.profiles ? fullName(p.profiles) : "—"}</Link><br /><span className="text-text-muted">{p.profiles?.email}</span></td>
                  <td className="py-2 pr-3">{p.worker_type === "employed" ? "Employee" : "Independent contractor"}</td>
                  <td className="py-2"><StatusChip kind="account" status={p.status} /></td>
                </tr>))}
            </tbody></table></div>
          ) : <Empty>No approved professionals yet.</Empty>}
        </Panel>
      </div>
    </>
  );
}
