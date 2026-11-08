import Link from "next/link";
import { Empty, PageTitle } from "@/components/dashboard/Shell";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import { dateTime, fullName } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Customers" };

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; role?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = (await supabaseServer())!;
  let q = db.from("profiles").select("id, first_name, last_name, email, role, status, created_at");
  q = q.eq("role", (sp.role as "customer" | "professional" | "admin") || "customer");
  if (sp.status) q = q.eq("status", sp.status as "active" | "suspended");
  if (sp.q) { const t = sp.q.replace(/[%_,()]/g, ""); q = q.or(`email.ilike.%${t}%,first_name.ilike.%${t}%,last_name.ilike.%${t}%`); }
  const [{ data: people }, { data: counts }] = await Promise.all([q.order("created_at", { ascending: false }).limit(300), db.from("bookings").select("customer_id")]);
  const bookingsBy = (id: string) => (counts ?? []).filter((b) => b.customer_id === id).length;
  return (
    <>
      <PageTitle title="Customers" intro="Registered accounts. Contact details are shown only to admins and only where needed to manage bookings." />
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Search name or email" aria-label="Search" className="input" />
        <select name="role" defaultValue={sp.role ?? "customer"} aria-label="Account type" className="input"><option value="customer">Customers</option><option value="professional">Professionals</option><option value="admin">Admins</option></select>
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="input"><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
        <button className="btn-secondary">Filter</button>
      </form>
      {people?.length ? (
        <div className="card overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-muted"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Bookings</th><th className="p-3">Joined</th><th className="p-3">Status</th></tr></thead>
          <tbody>{people.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface">
              <td className="p-3"><Link href={`/admin/customers/${p.id}`} className="font-semibold hover:text-green">{fullName(p)}</Link></td>
              <td className="p-3 break-all">{p.email}</td><td className="p-3">{bookingsBy(p.id)}</td>
              <td className="p-3 whitespace-nowrap">{dateTime(p.created_at).split(",")[0]}</td><td className="p-3"><StatusChip kind="account" status={p.status} /></td>
            </tr>))}</tbody>
        </table></div>
      ) : <Empty>No accounts match.</Empty>}
    </>
  );
}
