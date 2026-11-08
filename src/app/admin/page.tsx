import Link from "next/link";
import { Empty, Notice, PageTitle, Panel, Stat } from "@/components/dashboard/Shell";
import { CANCELLED, StatusChip, UPCOMING } from "@/components/dashboard/StatusChip";
import { requireAdmin } from "@/lib/auth";
import { serviceNames, type BookingRow } from "@/lib/bookings";
import { dateLong, money, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminOverview() {
  await requireAdmin();
  const db = (await supabaseServer())!;
  const today = new Date().toISOString().slice(0, 10);
  const c = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const head = { count: "exact" as const, head: true };
  const [customers, apps, pending, pros, total, upcoming, completed, cancelled, attention, { data: next }, { data: done }] = await Promise.all([
    c(db.from("profiles").select("id", head).eq("role", "customer")),
    c(db.from("professional_applications").select("id", head)),
    c(db.from("professional_applications").select("id", head).in("status", ["submitted", "under_review", "info_required"])),
    c(db.from("professionals").select("id", head).eq("status", "active")),
    c(db.from("bookings").select("id", head)),
    c(db.from("bookings").select("id", head).in("status", UPCOMING).gte("requested_date", today)),
    c(db.from("bookings").select("id", head).eq("status", "completed")),
    c(db.from("bookings").select("id", head).in("status", CANCELLED)),
    c(db.from("bookings").select("id", head).in("status", ["requested", "finding_professional", "escalated"]).gte("requested_date", today)),
    db.from("bookings").select("*").in("status", UPCOMING).gte("requested_date", today).order("requested_date").order("requested_time").limit(8),
    db.from("bookings").select("price_total_pence").eq("status", "completed"),
  ]);
  const list = (next ?? []) as BookingRow[];
  const names = await serviceNames(db, list.map((b) => b.service_slug));
  const bookedValue = (done ?? []).reduce((n, b) => n + b.price_total_pence, 0);

  return (
    <>
      <PageTitle title="Overview" intro="Live figures from the database. Nothing here is sample data." />
      {attention > 0 && <div className="mb-5"><Notice tone="warn"><b>{attention}</b> upcoming booking{attention === 1 ? "" : "s"} still need a professional. <Link href="/admin/bookings?status=open" className="link">Review</Link></Notice></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Registered customers" value={customers} />
        <Stat label="Professional applications" value={apps} note={`${pending} pending review`} />
        <Stat label="Approved professionals" value={pros} note="active" />
        <Stat label="Total bookings" value={total} />
        <Stat label="Upcoming bookings" value={upcoming} />
        <Stat label="Completed bookings" value={completed} />
        <Stat label="Cancelled bookings" value={cancelled} />
        <Stat label="Revenue" value="—" note={`Payments aren't switched on, so there's no revenue data. Booked value of completed jobs: ${money(bookedValue)}.`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Next bookings" action={<Link href="/admin/bookings" className="link text-sm">All bookings</Link>}>
          {list.length ? (
            <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>
              {list.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap">{dateLong(b.requested_date)} · {timeShort(b.requested_time)}</td>
                  <td className="py-2 pr-3"><Link href={`/admin/bookings/${b.id}`} className="font-semibold hover:text-green">{names[b.service_slug] ?? b.service_slug}</Link></td>
                  <td className="py-2 pr-3">{b.customer_name}</td>
                  <td className="py-2"><StatusChip status={b.status} /></td>
                </tr>
              ))}
            </tbody></table></div>
          ) : <Empty>No upcoming bookings.</Empty>}
        </Panel>
        <Panel title="To do">
          <ul className="grid gap-2 text-sm">
            <li><Link href="/admin/professionals" className="link">{pending} application{pending === 1 ? "" : "s"} to review</Link></li>
            <li><Link href="/admin/bookings?status=open" className="link">{attention} booking{attention === 1 ? "" : "s"} waiting for a professional</Link></li>
            <li><Link href="/admin/pricing" className="link">Review prices</Link></li>
            <li><Link href="/admin/interest" className="link">See which future services people want</Link></li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
