import { Empty, PageTitle } from "@/components/dashboard/Shell";
import { requireAdmin } from "@/lib/auth";
import { dateTime, fullName } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Activity log" };
const ENTITY: Record<string, string> = { services: "Service", service_options: "Service option", categories: "Category", professionals: "Professional", professional_applications: "Application", professional_services: "Approved services", profiles: "Account", settings: "Settings", bookings: "Booking" };

export default async function AdminActivity({ searchParams }: { searchParams: Promise<{ entity?: string }> }) {
  await requireAdmin();
  const { entity } = await searchParams;
  const db = (await supabaseServer())!;
  let q = db.from("audit_log").select("*");
  if (entity) q = q.eq("entity", entity);
  const { data } = await q.order("created_at", { ascending: false }).limit(200);
  const actorIds = [...new Set((data ?? []).map((r) => r.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length ? await db.from("profiles").select("id, first_name, last_name, email").in("id", actorIds) : { data: [] };
  const who = Object.fromEntries((actors ?? []).map((a) => [a.id, fullName(a) !== "—" ? fullName(a) : a.email]));
  const summary = (d: Record<string, unknown>, action: string) => action !== "updated" ? (d.name as string) ?? "" :
    Object.entries(d).map(([k, v]) => { const c = v as { from: unknown; to: unknown }; return k.endsWith("_pence") ? `${k.replace("_pence", "")}: £${Number(c.from ?? 0) / 100} → £${Number(c.to ?? 0) / 100}` : `${k}: ${JSON.stringify(c?.from)} → ${JSON.stringify(c?.to)}`; }).join("; ");
  return (
    <>
      <PageTitle title="Activity log" intro="Automatic record of changes to services, prices, categories, professionals, applications and account roles. It can't be edited." />
      <form className="mb-4 flex gap-2"><select name="entity" defaultValue={entity ?? ""} aria-label="Type" className="input h-9 w-56"><option value="">Everything</option>{Object.entries(ENTITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><button className="btn-secondary btn-sm">Filter</button></form>
      {data?.length ? (
        <div className="card overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">What</th><th className="p-3">Change</th></tr></thead>
          <tbody>{data.map((r) => (
            <tr key={r.id} className="border-b border-line align-top last:border-0">
              <td className="p-3 whitespace-nowrap">{dateTime(r.created_at)}</td><td className="p-3">{r.actor_id ? who[r.actor_id] ?? "Unknown" : "System"}</td>
              <td className="p-3">{ENTITY[r.entity] ?? r.entity} <span className="text-text-muted">{r.action}</span></td>
              <td className="max-w-[520px] break-words p-3 text-text-muted">{summary(r.details as Record<string, unknown>, r.action)}</td>
            </tr>))}</tbody>
        </table></div>
      ) : <Empty>Nothing recorded yet.</Empty>}
    </>
  );
}
