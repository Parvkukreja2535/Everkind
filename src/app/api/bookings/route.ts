import { NextResponse } from "next/server";
import { z } from "zod";
import { getService, INSTANT_CLEAN_TASKS } from "@/lib/catalogue";
import { bookingReference, checkTiming, isBookable, priceBooking } from "@/lib/booking";
import { checkCoverage } from "@/lib/coverage";
import { SITE } from "@/lib/site";
import { db, NOT_CONNECTED_MESSAGE } from "@/lib/server/db";
import { sendEmail } from "@/lib/server/email";

const Body = z.object({
  serviceSlug: z.string().max(80),
  optionSlug: z.string().max(40).optional(),
  hours: z.number().min(1).max(8).optional(),
  tasks: z.array(z.enum(INSTANT_CLEAN_TASKS as [string, ...string[]])).max(8).optional(),
  asap: z.boolean().optional(),
  date: z.string().max(10),
  time: z.string().max(5),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  addressLine: z.string().trim().min(3).max(200),
  postcode: z.string().trim().min(5).max(10),
  notes: z.string().trim().max(1000).optional().nullable(),
  acceptTerms: z.literal(true),
});

const bad = (message: string, status = 400) => NextResponse.json({ message }, { status });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Please check your details: every field except notes is needed, and you must accept the terms.");
  const b = parsed.data;

  const service = getService(b.serviceSlug);
  if (!isBookable(service)) return bad("This service can't be booked yet. You can register interest on its page.");

  const price = priceBooking({ serviceSlug: b.serviceSlug, optionSlug: b.optionSlug, hours: b.hours });
  if (!price.ok) return bad(price.error);
  if (service.slug === "instant-clean" && !b.tasks?.length) return bad("Choose at least one task.");

  const timingError = checkTiming({ date: b.date, time: b.time, durationMinutes: price.durationMinutes, workforce: service.workforce, asap: service.slug === "instant-clean" && b.asap });
  if (timingError) return bad(timingError);

  const coverage = await checkCoverage(b.postcode);
  if (coverage.status === "outside") return bad(`Sorry, ${coverage.postcode} is outside our launch area. We currently cover 6 miles from the City of London.`);
  if (coverage.status !== "covered") return bad(coverage.message);

  const supabase = db();
  if (!supabase) return bad(NOT_CONNECTED_MESSAGE, 503);

  const isContractor = service.workforce === "contractor";
  const status = isContractor ? "finding_professional" : "requested";
  const reference = bookingReference();
  const when = b.asap ? "as soon as possible today" : `${new Date(`${b.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at ${b.time}`;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_slug: service.slug,
      workbook_row: service.options?.find((o) => o.slug === b.optionSlug)?.workbookRow ?? service.workbookRow,
      option_slug: b.optionSlug ?? null,
      workforce: service.workforce,
      status,
      asap: !!b.asap,
      requested_date: b.date,
      requested_time: b.asap ? null : b.time,
      duration_minutes: price.durationMinutes,
      hours: b.hours ?? null,
      tasks: b.tasks ?? null,
      price_total_pence: price.totalPence,
      price_description: price.description,
      customer_name: b.name,
      customer_email: b.email,
      customer_phone: b.phone,
      address_line: b.addressLine,
      postcode: coverage.postcode,
      notes: b.notes || null,
      terms_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !booking) return bad("We couldn't save your booking. Please try again in a moment.", 500);

  await supabase.from("booking_events").insert({ booking_id: booking.id, status, note: "Booking submitted on website" });

  const message = isContractor
    ? `We've received your request for ${price.description.toLowerCase()} ${when}. We're finding a vetted professional now and will email you as soon as one accepts.`
    : `We've received your booking for ${price.description.toLowerCase()} ${when}. We'll email you to confirm your team member and arrival window.`;

  await sendEmail(supabase, {
    to: b.email,
    bookingId: booking.id,
    subject: `${isContractor ? "Request received" : "Booking received"}: ${service.name} (${reference})`,
    text: [
      `Hi ${b.name.split(" ")[0]},`,
      "",
      message,
      "",
      `Reference: ${reference}`,
      `Service: ${price.description}`,
      `When: ${when}`,
      `Address: ${b.addressLine}, ${coverage.postcode}`,
      `Price: £${(price.totalPence / 100).toFixed(2)}${service.options && b.optionSlug === "furniture" ? " for the first hour; any extra time only with your approval" : ""}`,
      ...(b.tasks?.length ? [`Tasks (in priority order): ${b.tasks.join("; ")}`] : []),
      "",
      SITE.noPayment,
      SITE.cancellation,
      "Arrival times are estimates and may change. We'll update you if anything changes.",
      "",
      `Questions? Reply to ${SITE.email}.`,
      "Everkind",
    ].join("\n"),
  });

  return NextResponse.json({ reference, status, message });
}
