import type { Metadata } from "next";
import Link from "next/link";
import { Empty, Notice, PageTitle, Panel } from "@/components/dashboard/Shell";
import { StatusChip, UPCOMING, bookingStatusLabel } from "@/components/dashboard/StatusChip";
import { requireUser } from "@/lib/auth";
import { serviceNames, type BookingRow } from "@/lib/bookings";
import { dateLong, dateTime, fullName, timeShort } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account" };

export default async function AccountOverview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { profile, user } = await requireUser("/account");
  const sp = await searchParams;
  const supabase = (await supabaseServer())!;
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: upcoming }, { data: events }] = await Promise.all([
    supabase.from("bookings").select("*").in("status", UPCOMING).gte("requested_date", today).order("requested_date").limit(3),
    supabase.from("booking_events").select("status, created_at, booking_id, bookings(reference, service_slug)").order("created_at", { ascending: false }).limit(6),
  ]);
  const list = (upcoming ?? []) as BookingRow[];
  type Ev = { status: string; created_at: string; booking_id: string; bookings: { reference: string; service_slug: string } | null };
  const evs = (events ?? []) as unknown as Ev[];
  const names = await serviceNames(supabase, [...list.map((b) => b.service_slug), ...evs.map((e) => e.bookings?.service_slug ?? "")].filter(Boolean));

  return (
    <>
      {sp.denied && <div className="mb-4"><Notice tone="warn">You don't have access to that area.</Notice></div>}
      <PageTitle title={`Welcome, ${profile.first_name || "there"}`} intro="Your bookings and account in one place." action={<Link href="/services" className="btn-primary">Book a service</Link>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Upcoming bookings" action={<Link href="/account/bookings" className="link text-sm">All bookings</Link>}>
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((b) => (
                <li key={b.id}>
                  <Link href={`/account/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-green">
                    <span><b>{names[b.service_slug] ?? b.price_description}</b><br /><span className="text-sm text-text-muted">{dateLong(b.requested_date)} · {timeShort(b.requested_time)} · {b.postcode}</span></span>
                    <StatusChip status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty>No upcoming bookings yet. <Link href="/services" className="link">Find a service</Link></Empty>}
        </Panel>
        <Panel title="Account information" action={<Link href="/account/profile" className="link text-sm">Edit</Link>}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-text-muted">Name</dt><dd>{fullName(profile)}</dd>
            <dt className="text-text-muted">Email</dt><dd className="break-all">{user.email}</dd>
            <dt className="text-text-muted">Phone</dt><dd>{profile.phone || "—"}</dd>
            <dt className="text-text-muted">Member since</dt><dd>{dateTime(profile.created_at).split(",")[0]}</dd>
          </dl>
        </Panel>
        <Panel title="Recent activity" className="xl:col-span-2">
          {evs.length ? (
            <ul className="grid gap-2 text-sm">
              {evs.map((e, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 last:border-0">
                  <span><Link href={`/account/bookings/${e.booking_id}`} className="font-semibold hover:text-green">{names[e.bookings?.service_slug ?? ""] ?? e.bookings?.reference}</Link> — {bookingStatusLabel(e.status)}</span>
                  <span className="text-text-muted">{dateTime(e.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty>Activity on your bookings will appear here.</Empty>}
        </Panel>
      </div>
      <p className="mt-6 text-xs text-text-muted">Prices shown are booking prices. No payment is taken online.</p>
    </>
  );
}
