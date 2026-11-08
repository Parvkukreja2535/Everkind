import Image from "next/image";
import Link from "next/link";
import { Empty, Notice, PageTitle } from "@/components/dashboard/Shell";
import { AvailabilityChip } from "@/components/AvailabilityChip";
import { requireAdmin } from "@/lib/auth";
import type { Availability } from "@/lib/catalogue";
import { money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { moveServiceAction, restoreServiceAction, toggleServiceAction } from "../actions";

export const metadata = { title: "Services" };

export default async function AdminServices({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; availability?: string; show?: string; removed?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = (await supabaseServer())!;
  const { data: cats } = await db.from("categories").select("id, name").order("sort_order");
  let q = db.from("services").select("id, slug, name, image_url, availability, workforce, price_type, price_pence, is_active, archived_at, sort_order, category_id, categories(name, sort_order)");
  if (sp.category) q = q.eq("category_id", sp.category);
  if (sp.availability) q = q.eq("availability", sp.availability);
  q = sp.show === "archived" ? q.not("archived_at", "is", null) : q.is("archived_at", null);
  if (sp.show === "disabled") q = q.eq("is_active", false);
  if (sp.q) q = q.ilike("name", `%${sp.q.replace(/[%_]/g, "")}%`);
  const { data } = await q.order("sort_order");
  type Row = { id: string; slug: string; name: string; image_url: string; availability: Availability; workforce: string; price_type: string; price_pence: number | null; is_active: boolean; archived_at: string | null; categories: { name: string; sort_order: number } | null };
  const rows = ((data ?? []) as unknown as Row[]).sort((a, b) => (a.categories?.sort_order ?? 0) - (b.categories?.sort_order ?? 0));

  return (
    <>
      <PageTitle title="Services" intro="Changes here update the public website and booking pages straight away." action={<Link href="/admin/services/new" className="btn-primary">Add service</Link>} />
      {sp.removed && <div className="mb-4"><Notice tone="ok">Service removed. Services with bookings are archived so their history is kept.</Notice></div>}
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Search services" aria-label="Search services" className="input" />
        <select name="category" defaultValue={sp.category ?? ""} aria-label="Category" className="input"><option value="">All categories</option>{(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="availability" defaultValue={sp.availability ?? ""} aria-label="Availability" className="input"><option value="">Any label</option><option value="available_now">Available now</option><option value="coming_soon">Coming soon</option><option value="planned">Planned</option><option value="subject_to_approval">Subject to approval</option></select>
        <select name="show" defaultValue={sp.show ?? ""} aria-label="Status" className="input"><option value="">Live and disabled</option><option value="disabled">Disabled only</option><option value="archived">Archived</option></select>
        <button className="btn-secondary">Filter</button>
      </form>
      {rows.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="p-3">Service</th><th className="p-3">Category</th><th className="p-3">Label</th><th className="p-3">Price</th><th className="p-3">Shown</th><th className="p-3">Order</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface">
                  <td className="p-3"><div className="flex items-center gap-3">{s.image_url && <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded"><Image src={s.image_url} alt="" fill sizes="56px" className="object-cover" /></span>}<Link href={`/admin/services/${s.id}`} className="font-semibold hover:text-green">{s.name}</Link></div></td>
                  <td className="p-3">{s.categories?.name}</td>
                  <td className="p-3"><AvailabilityChip availability={s.availability} /></td>
                  <td className="p-3 tabular-nums">{s.price_pence == null ? "—" : `${money(s.price_pence)}${s.price_type === "hourly" ? "/hr" : ""}`}</td>
                  <td className="p-3">
                    {s.archived_at ? (
                      <form action={restoreServiceAction}><input type="hidden" name="id" value={s.id} /><button className="link text-sm">Restore</button></form>
                    ) : (
                      <form action={toggleServiceAction}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="active" value={String(!s.is_active)} />
                        <button role="switch" aria-checked={s.is_active} aria-label={`Show ${s.name} on the website`} className={`relative h-6 w-11 rounded-full transition ${s.is_active ? "bg-green" : "bg-line"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${s.is_active ? "left-[22px]" : "left-0.5"}`} /></button>
                      </form>
                    )}
                  </td>
                  <td className="p-3"><div className="flex gap-1">
                    <form action={moveServiceAction}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button aria-label={`Move ${s.name} up`} className="rounded border border-line px-2 hover:border-green">↑</button></form>
                    <form action={moveServiceAction}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button aria-label={`Move ${s.name} down`} className="rounded border border-line px-2 hover:border-green">↓</button></form>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>No services match these filters.</Empty>}
    </>
  );
}
