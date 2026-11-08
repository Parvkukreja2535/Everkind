import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { requireAdmin } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { archiveServiceAction } from "../../actions";
import { OptionEditor, ServiceEditor, type EditableOption } from "../ServiceEditor";

export const metadata = { title: "Edit service" };

export default async function EditService({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = (await supabaseServer())!;
  const [{ data: s }, { data: cats }, { data: opts }, { data: log }] = await Promise.all([
    db.from("services").select("*, categories(slug)").eq("id", id).maybeSingle(),
    db.from("categories").select("id, name").order("sort_order"),
    db.from("service_options").select("*").eq("service_id", id).order("sort_order"),
    db.from("audit_log").select("action, details, created_at, actor_id").eq("entity", "services").eq("entity_id", id).order("created_at", { ascending: false }).limit(10),
  ]);
  if (!s) notFound();
  const catSlug = (s.categories as { slug: string } | null)?.slug;
  return (
    <>
      <p className="mb-3 text-sm"><Link href="/admin/services" className="link font-normal">← Services</Link></p>
      <PageTitle title={s.name} intro={s.workbook_row ? `Workbook row ${s.workbook_row}${s.everkind_addition ? " · Everkind addition" : ""}` : "Added in the admin dashboard"} action={catSlug && <Link href={`/services/${catSlug}/${s.slug}`} className="btn-secondary" target="_blank">View on website</Link>} />
      {(await searchParams).created && <div className="mb-4"><Notice tone="ok">Service created.</Notice></div>}
      {s.archived_at && <div className="mb-4"><Notice tone="warn">This service is archived and hidden from the website.</Notice></div>}
      <ServiceEditor service={s} categories={cats ?? []} />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Options">
          <p className="mb-3 text-sm text-text-muted">Options appear inside this service's booking form, e.g. Furniture assembly → Flat-pack assembly. They don't create separate service cards.</p>
          <div className="grid gap-3">
            {(opts ?? []).map((o) => <OptionEditor key={o.id} serviceId={s.id} option={o as EditableOption} />)}
            <details><summary className="cursor-pointer text-sm font-semibold text-green">Add an option</summary><div className="mt-3"><OptionEditor serviceId={s.id} /></div></details>
          </div>
        </Panel>
        <Panel title="Change history">
          {(log ?? []).length ? (
            <ul className="grid gap-2 text-sm">
              {(log ?? []).map((l, i) => (
                <li key={i} className="border-b border-line pb-2 last:border-0"><b className="capitalize">{l.action}</b> · <span className="text-text-muted">{dateTime(l.created_at)}</span><br />
                  <span className="text-text-muted">{l.action === "updated" ? Object.keys(l.details as object).join(", ") : ""}</span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-text-muted">No changes recorded yet.</p>}
          <form action={archiveServiceAction} className="mt-5 border-t border-line pt-4">
            <input type="hidden" name="id" value={s.id} />
            <p className="mb-2 text-sm text-text-muted">Remove this service from the website. If it has bookings it's archived (history kept); otherwise it's deleted.</p>
            <button className="btn border border-line text-status-err hover:border-status-err">Archive or delete service</button>
          </form>
        </Panel>
      </div>
    </>
  );
}
