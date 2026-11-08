import { PageTitle, Panel } from "@/components/dashboard/Shell";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { moveCategoryAction } from "../actions";
import { CategoryEditor } from "./CategoryEditor";

export const metadata = { title: "Categories" };

export default async function AdminCategories() {
  await requireAdmin();
  const db = (await supabaseServer())!;
  const [{ data: cats }, { data: svc }] = await Promise.all([db.from("categories").select("*").order("sort_order"), db.from("services").select("category_id").is("archived_at", null)]);
  const count = (id: string) => (svc ?? []).filter((s) => s.category_id === id).length;
  return (
    <>
      <PageTitle title="Categories" intro="Deactivating a category hides it and all its services from the website. Services stay linked to their category." />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-3">
          {(cats ?? []).map((c) => (
            <details key={c.id} className="card p-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                <span><b>{c.name}</b> <span className="text-sm text-text-muted">· {count(c.id)} services{c.is_active ? "" : " · inactive"}</span></span>
                <span className="flex gap-1">
                  <form action={moveCategoryAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="up" /><button aria-label={`Move ${c.name} up`} className="rounded border border-line px-2 hover:border-green">↑</button></form>
                  <form action={moveCategoryAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="down" /><button aria-label={`Move ${c.name} down`} className="rounded border border-line px-2 hover:border-green">↓</button></form>
                  <span className="ml-2 text-sm text-green">Edit</span>
                </span>
              </summary>
              <div className="mt-4 border-t border-line pt-4"><CategoryEditor category={c} /></div>
            </details>
          ))}
        </div>
        <Panel title="Add a category"><CategoryEditor /></Panel>
      </div>
    </>
  );
}
