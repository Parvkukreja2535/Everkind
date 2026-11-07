// Booking rules shared by the booking form (browser) and the booking API (server).
// The server recalculates everything; the browser copy is only for showing totals early.
import { getService, INSTANT_CLEAN_HOURS, type Service } from "./catalogue";
import { SITE } from "./site";

/** Typical job length used to keep bookings inside 8am–8pm (workbook: 2.25h average clean). */
export const DURATION_MINUTES: Record<string, number> = {
  "short-let-turnover-studio": 120,
  "short-let-turnover-1-bedroom": 150,
  "short-let-turnover-2-bedroom": 180,
  "short-let-turnover-3-bedroom": 210,
  "womens-haircut-trim": 60,
  "blow-dry-styling": 45,
  manicure: 45,
  "mens-haircut": 45,
  "haircut-and-beard-trim": 60,
  "picture-mirror-shelf-hanging": 60,
  "curtain-rail-blind-installation": 90,
};

export const NOTICE_MINUTES = { employed: 120, contractor: 24 * 60 };

export function isBookable(s: Service | undefined): s is Service {
  return !!s && !s.optionOf && s.availability === "available_now" && s.pricePence != null;
}

export interface PriceInput {
  serviceSlug: string;
  optionSlug?: string;
  hours?: number;
}

export interface PriceResult {
  ok: true;
  totalPence: number;
  durationMinutes: number;
  description: string;
}

/** Customer-facing total in pence. Instant Clean: hourly rate × hours (requirements v1.2). */
export function priceBooking(input: PriceInput): PriceResult | { ok: false; error: string } {
  const service = getService(input.serviceSlug);
  if (!isBookable(service)) return { ok: false, error: "This service can't be booked yet." };

  if (service.slug === "instant-clean") {
    const hours = input.hours ?? 0;
    if (!INSTANT_CLEAN_HOURS.includes(hours)) return { ok: false, error: "Choose how many hours you need." };
    return { ok: true, totalPence: Math.round(service.pricePence! * hours), durationMinutes: hours * 60, description: `Instant Clean, ${hours} hour${hours === 1 ? "" : "s"}` };
  }

  if (service.options) {
    const option = service.options.find((o) => o.slug === input.optionSlug);
    if (!option) return { ok: false, error: "Choose what you need assembled." };
    const hours = Math.max(1, input.hours ?? 1);
    if (!Number.isInteger(hours * 2) || hours > 8) return { ok: false, error: "Choose a valid number of hours." };
    // Furniture: first hour quoted, extra time only with approval (charged later). Flat-pack: hourly.
    const billable = option.priceType === "hourly" ? hours : 1;
    return { ok: true, totalPence: option.pricePence * billable, durationMinutes: hours * 60, description: `${option.name}, ${hours} hour${hours === 1 ? "" : "s"} estimated` };
  }

  return { ok: true, totalPence: service.pricePence!, durationMinutes: DURATION_MINUTES[service.slug] ?? 60, description: service.name };
}

/** Current London wall-clock time as { date: "YYYY-MM-DD", minutes } so rules follow UK time. */
export function londonNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
const absMinutes = (date: string, minutes: number) => dayNumber(date) * 1440 + minutes;

export function parseTime(t: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v >= 0 && v < 1440 ? v : null;
}

/** Checks operating hours (8am–8pm, must finish by 8pm) and minimum notice. Returns an error message or null. */
export function checkTiming(opts: { date: string; time: string; durationMinutes: number; workforce: Service["workforce"]; asap?: boolean; now?: Date }): string | null {
  const now = londonNow(opts.now);
  const open = SITE.opensHour * 60;
  const close = SITE.closesHour * 60;
  if (opts.asap) {
    const start = now.minutes + 30; // allow for travel; the real estimate comes from dispatch
    if (now.minutes < open || start + opts.durationMinutes > close) {
      return "Instant Clean as soon as possible is only available when the job can finish by 8:00pm. Choose a later time instead.";
    }
    return null;
  }
  const start = parseTime(opts.time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date) || start == null) return "Choose a date and time.";
  if (start < open || start + opts.durationMinutes > close) {
    return "We work 8:00am–8:00pm. Choose a start time that lets the job finish by 8:00pm.";
  }
  const notice = opts.workforce === "contractor" ? NOTICE_MINUTES.contractor : NOTICE_MINUTES.employed;
  if (absMinutes(opts.date, start) < absMinutes(now.date, now.minutes) + notice) {
    return opts.workforce === "contractor"
      ? "Handyman requests need at least 24 hours' notice so a professional can accept."
      : "Please book at least 2 hours ahead.";
  }
  if (dayNumber(opts.date) > dayNumber(now.date) + 90) return "You can book up to 90 days ahead.";
  return null;
}

/** 30-minute start times between opening and the latest start that finishes by closing. */
export function startTimes(durationMinutes: number) {
  const out: string[] = [];
  for (let m = SITE.opensHour * 60; m + durationMinutes <= SITE.closesHour * 60; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export function bookingReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "EK-";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) ref += alphabet[b % alphabet.length];
  return ref;
}
