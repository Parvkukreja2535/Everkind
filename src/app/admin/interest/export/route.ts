import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// CSV export of interest registrations. Admin only (checked here AND by RLS).
const csv = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"` : s; };

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin" || session.profile.status !== "active") return new NextResponse("Forbidden", { status: 403 });
  const db = (await supabaseServer())!;
  const sp = request.nextUrl.searchParams;
  const { data: services } = await db.from("services").select("slug, name, category_id");
  let q = db.from("service_interest").select("service_slug, email, postcode, marketing_opt_in, consent_text, created_at, unsubscribed_at").is("unsubscribed_at", null);
  const service = sp.get("service"), category = sp.get("category"), from = sp.get("from");
  if (service) q = q.eq("service_slug", service);
  else if (category) q = q.in("service_slug", (services ?? []).filter((s) => s.category_id === category).map((s) => s.slug).concat("-"));
  if (from) q = q.gte("created_at", from);
  const { data } = await q.order("created_at");
  const name = Object.fromEntries((services ?? []).map((s) => [s.slug, s.name]));
  const rows = [["service", "email", "postcode", "news_opt_in", "consent", "registered_at"], ...(data ?? []).map((r) => [name[r.service_slug] ?? r.service_slug, r.email, r.postcode, r.marketing_opt_in ? "yes" : "no", r.consent_text, r.created_at])];
  return new NextResponse(rows.map((r) => r.map(csv).join(",")).join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="everkind-interest-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
