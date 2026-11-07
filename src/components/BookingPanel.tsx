"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarCheck, Clock, Info, Users } from "lucide-react";
import { formatPence, INSTANT_CLEAN_HOURS, INSTANT_CLEAN_TASKS, type Service } from "@/lib/catalogue";
import { londonNow, priceBooking, startTimes } from "@/lib/booking";
import { SITE } from "@/lib/site";

type Result =
  | { kind: "ok"; reference: string; status: string; message: string }
  | { kind: "error"; message: string };

const TASK_SHORT = ["General tidying", "Washing dishes", "Kitchen cleaning", "Bathroom cleaning", "Vacuuming and mopping", "Dusting", "Making beds", "Emptying bins"];

export function BookingPanel({ service }: { service: Service }) {
  const isInstant = service.slug === "instant-clean";
  const isContractor = service.workforce === "contractor";
  const today = londonNow().date;

  const [option, setOption] = useState(service.options?.[0]?.slug ?? "");
  const [hours, setHours] = useState(isInstant ? 2 : 1);
  const [tasks, setTasks] = useState<number[]>(isInstant ? [0, 1, 2] : []);
  const [asap, setAsap] = useState(isInstant);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const price = useMemo(() => priceBooking({ serviceSlug: service.slug, optionSlug: option || undefined, hours }), [service.slug, option, hours]);
  const duration = price.ok ? price.durationMinutes : 60;
  const times = startTimes(duration);
  const showsHours = isInstant || !!service.options;

  function toggleTask(i: number) {
    setTasks((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          optionSlug: option || undefined,
          hours: showsHours ? hours : undefined,
          tasks: isInstant ? tasks.map((i) => INSTANT_CLEAN_TASKS[i]) : undefined,
          asap: isInstant && asap,
          date: asap ? today : date,
          time: asap ? "" : time,
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          addressLine: f.get("addressLine"),
          postcode: f.get("postcode"),
          notes: f.get("notes"),
          acceptTerms: f.get("acceptTerms") === "on",
        }),
      });
      const data = await res.json();
      setResult(res.ok ? { kind: "ok", reference: data.reference, status: data.status, message: data.message } : { kind: "error", message: data.message ?? "Something went wrong. Please try again." });
    } catch {
      setResult({ kind: "error", message: "We couldn't send your booking. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  if (result?.kind === "ok") {
    return (
      <aside className="card p-6" aria-live="polite">
        <CalendarCheck className="text-green" size={28} aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">{isContractor ? "Request received" : "Booking received"}</h2>
        <p className="mt-1 text-sm text-text-muted">Reference <b className="tabular-nums text-text">{result.reference}</b></p>
        <p className="mt-4">{result.message}</p>
        <p className="mt-4 text-sm text-text-muted">{SITE.noPayment}</p>
        <p className="mt-2 text-sm text-text-muted">{SITE.cancellation} Questions? Email <span className="select-all">{SITE.email}</span>.</p>
      </aside>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6" aria-label={`Book ${service.name}`}>
      <h2 className="text-lg font-semibold">{isContractor ? "Request this service" : "Book this service"}</h2>
      <p className="mt-1 text-sm text-text-muted">{isInstant ? `${formatPence(service.pricePence!)} per hour · 1-hour minimum · ${SITE.hours}` : `${service.priceNote} · ${SITE.hours}`}</p>

      {service.options && (
        <fieldset className="mt-5">
          <legend className="label">What are we assembling?</legend>
          <div className="grid gap-2">
            {service.options.map((o) => (
              <label key={o.slug} className={`flex cursor-pointer gap-3 rounded-ctl border p-3 ${option === o.slug ? "border-green bg-green-tint" : "border-line"}`}>
                <input type="radio" name="option" value={o.slug} checked={option === o.slug} onChange={() => setOption(o.slug)} className="mt-1 accent-green" />
                <span><span className="font-semibold">{o.name}</span><br /><span className="text-sm text-text-muted">{o.description} {o.priceNote}.</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {isInstant && (
        <fieldset className="mt-5">
          <legend className="label">Choose your tasks <span className="font-normal text-text-muted">(in order of priority)</span></legend>
          <div className="grid gap-1.5">
            {TASK_SHORT.map((t, i) => (
              <label key={t} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 text-[15px]">
                <input type="checkbox" checked={tasks.includes(i)} onChange={() => toggleTask(i)} className="accent-green" />
                <span>{t}</span>
                {tasks.includes(i) && <span className="ml-auto text-xs text-text-muted">Priority {tasks.indexOf(i) + 1}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {showsHours && (
        <fieldset className="mt-5">
          <legend className="label">{isInstant ? "Hours" : "Estimated hours"}</legend>
          <div className="flex flex-wrap gap-2">
            {(isInstant ? INSTANT_CLEAN_HOURS : [1, 2, 3, 4]).map((h) => (
              <button key={h} type="button" aria-pressed={hours === h} onClick={() => setHours(h)} className={`h-10 min-w-14 rounded-lg border px-3 text-sm ${hours === h ? "border-green bg-green text-white" : "border-line bg-white"}`}>{h}h</button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="mt-5">
        <legend className="label">When</legend>
        {isInstant && (
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={asap} onClick={() => setAsap(true)} className={`h-10 rounded-lg border px-3 text-sm ${asap ? "border-green bg-green text-white" : "border-line"}`}>As soon as possible</button>
            <button type="button" aria-pressed={!asap} onClick={() => setAsap(false)} className={`h-10 rounded-lg border px-3 text-sm ${!asap ? "border-green bg-green text-white" : "border-line"}`}>Choose a time</button>
          </div>
        )}
        {!asap && (
          <div className="grid grid-cols-2 gap-2">
            <div><label htmlFor="b-date" className="sr-only">Date</label><input id="b-date" type="date" className="input" min={today} required value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div>
              <label htmlFor="b-time" className="sr-only">Start time</label>
              <select id="b-time" className="input" required value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="">Start time</option>
                {times.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
        <p className="mt-2 flex gap-2 text-sm text-text-muted"><Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{isInstant && asap ? "We'll send your estimated arrival time once a cleaner is assigned. Arrival times are estimates and may change." : "Arrival times are estimates and may change. We'll confirm your arrival window."}</p>
      </fieldset>

      <fieldset className="mt-5 grid gap-3">
        <legend className="label">Your details</legend>
        <div><label htmlFor="b-name" className="label">Full name</label><input id="b-name" name="name" className="input" autoComplete="name" required /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="b-email" className="label">Email</label><input id="b-email" name="email" type="email" className="input" autoComplete="email" required /></div>
          <div><label htmlFor="b-phone" className="label">Phone</label><input id="b-phone" name="phone" type="tel" className="input" autoComplete="tel" required /></div>
        </div>
        <div><label htmlFor="b-address" className="label">Address</label><input id="b-address" name="addressLine" className="input" autoComplete="street-address" required /></div>
        <div><label htmlFor="b-postcode" className="label">Postcode</label><input id="b-postcode" name="postcode" className="input" autoComplete="postal-code" required /></div>
        <div><label htmlFor="b-notes" className="label">Notes for your {isContractor ? "professional" : "team member"} <span className="font-normal text-text-muted">(optional)</span></label><textarea id="b-notes" name="notes" rows={3} maxLength={1000} className="input h-auto py-2" placeholder={isContractor ? "What needs doing, item names, wall type…" : "Access, parking, anything we should know…"} /></div>
      </fieldset>

      {isContractor && (
        <p className="mt-4 flex gap-2 rounded-ctl bg-[#E3ECF1] p-3 text-sm text-[#24485C]"><Users size={18} className="mt-0.5 shrink-0" aria-hidden="true" />You'll get "Request received" straight away. Your booking is confirmed once a vetted professional accepts, and we'll email you their name and arrival window.</p>
      )}
      {isInstant && <p className="mt-4 text-sm text-text-muted">Your cleaner works through your selected tasks in priority order within the time booked. We can't guarantee every task will be completed in the time chosen.</p>}

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
        <span>Total{service.options && option === "furniture" ? " (first hour)" : ""}<br /><span className="text-sm text-text-muted">{SITE.noPayment.split(".")[0]}.</span></span>
        <span className="text-2xl font-semibold tabular-nums">{price.ok ? formatPence(price.totalPence) : "—"}</span>
      </div>

      <label className="mt-4 flex gap-3 text-sm text-text-muted">
        <input type="checkbox" name="acceptTerms" required className="mt-1 accent-green" />
        <span>I agree to the <Link href="/legal/terms" className="link font-normal">terms</Link> and <Link href="/legal/cancellation" className="link font-normal">cancellation policy</Link>, and to Everkind using my details to manage this booking (see the <Link href="/legal/privacy" className="link font-normal">privacy notice</Link>).</span>
      </label>

      {result?.kind === "error" && <p role="alert" className="mt-4 flex gap-2 rounded-ctl bg-[#F8E6E3] p-3 text-sm text-status-err"><Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{result.message}</p>}

      <button type="submit" className="btn-primary btn-lg mt-5 w-full" disabled={busy || (isInstant && tasks.length === 0)}>
        {busy ? "Sending…" : isContractor ? "Send request" : "Confirm booking"}
      </button>
    </form>
  );
}
