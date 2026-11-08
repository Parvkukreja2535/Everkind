import { NextResponse } from "next/server";
import { z } from "zod";
import { bookingReference, checkTiming, isBookable, priceBooking } from "@/lib/booking";
import { getServiceBySlug } from "@/lib/catalogue-data";
import { checkCoverage, normalisePostcode } from "@/lib/coverage";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { NOT_CONNECTED_MESSAGE, supabaseService } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/server/email";

const Body = z.object({
  serviceSlug: z.string().max(80),
  optionSlug: z.string().max(40).optional(),
  hours: z.number().min(0.5).max(12).optional(),
  tasks: z.array(z.string().max(200)).max(20).optional(),
  asap: z.boolean().optional(),
  date: z.string().max(10),
  time: z.string().max(5),
  addressId: z.string().uuid().optional(),
  addressLine: z.string().trim().min(3).max(200).optional(),
  postcode: z.string().trim().min(5).max(10).optional(),
  saveAddress: z.boolean().optional(),
  phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/),
  notes: z.string().trim().max(1000).optional().nullable(),
  acceptTerms: z.literal(true),
});

const bad = (message: string, status = 400) => NextResponse.json({ message }, { status });

export async function POST(req: Request) {
  const service_ = supabaseService();
  if (!service_) return bad(NOT_CONNECTED_MESSAGE, 503);

  // 1. Who is booking? Verified with Supabase from the session cookie.
  const session = await getSession();
  if (!session) return bad("Please log in to book.", 401);
  if (session.profile.status !== "active") return bad("This account is suspended. Please contact us.", 403);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Please check your details: date, time, address and phone are needed, and you must accept the terms.");
  const b = parsed.data;

  // 2. The service and its CURRENT price come from the database, never from the browser.
  const service = await getServiceBySlug(b.serviceSlug);
  if (!isBookable(service)) return bad("This service can't be booked yet. You can register interest on its page.");
  const price = priceBooking(service, { optionSlug: b.optionSlug, hours: b.hours });
  if (!price.ok) return bad(price.error);

  const isInstant = service.slug === "instant-clean";
  const tasks = isInstant ? (b.tasks ?? []).filter((t) => service.included.includes(t)) : [];
  if (isInstant && !tasks.length) return bad("Choose at least one task.");

  const timingError = checkTiming({ date: b.date, time: b.time, durationMinutes: price.durationMinutes, workforce: service.workforce, asap: isInstant && b.asap });
  if (timingError) return bad(timingError);

  // 3. Address: a saved one (RLS only returns the customer's own) or a new one.
  const userDb = (await supabaseServer())!;
  let addressLine = b.addressLine;
  let postcode = b.postcode;
  if (b.addressId) {
    const { data: a } = await userDb.from("customer_addresses").select("*").eq("id", b.addressId).maybeSingle();
    if (!a) return bad("We couldn't find that saved address.");
    addressLine = [a.line1, a.line2, a.city].filter(Boolean).join(", ");
    postcode = a.postcode;
  }
  if (!addressLine || !postcode) return bad("Enter the address for this booking.");

  const coverage = await checkCoverage(postcode);
  if (coverage.status === "outside") return bad(`Sorry, ${coverage.postcode} is outside our launch area. We currently cover 6 miles from the City of London.`);
  if (coverage.status !== "covered") return bad(coverage.message);

  if (!b.addressId && b.saveAddress) {
    await userDb.from("customer_addresses").insert({ user_id: session.user.id, label: "Saved", line1: addressLine, postcode: normalisePostcode(postcode) });
  }

  // 4. Save with the server key (customers cannot write bookings directly), linked to the account.
  const isContractor = service.workforce === "contractor";
  const status = isContractor ? "finding_professional" : "requested";
  const reference = bookingReference();
  const name = [session.profile.first_name, session.profile.last_name].filter(Boolean).join(" ") || session.user.email!;
  const when = b.asap ? "as soon as possible today" : `${new Date(`${b.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at ${b.time}`;

  const { data: booking, error } = await service_
    .from("bookings")
    .insert({
      reference,
      service_slug: service.slug,
      service_id: service.id ?? null,
      workbook_row: service.options?.find((o) => o.slug === b.optionSlug)?.workbookRow ?? service.workbookRow,
      option_slug: b.optionSlug ?? null,
      workforce: service.workforce,
      status,
      asap: !!b.asap,
      requested_date: b.date,
      requested_time: b.asap ? null : b.time,
      duration_minutes: price.durationMinutes,
      hours: price.hours,
      tasks: tasks.length ? tasks : null,
      price_total_pence: price.totalPence,
      price_description: price.description,
      customer_id: session.user.id,
      customer_name: name,
      customer_email: session.user.email,
      customer_phone: b.phone,
      address_line: addressLine,
      postcode: coverage.postcode,
      notes: b.notes || null,
      terms_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !booking) return bad("We couldn't save your booking. Please try again in a moment.", 500);

  await service_.from("booking_events").insert({ booking_id: booking.id, status, note: "Booking sent from the website", actor_id: session.user.id });

  const message = isContractor
    ? `We've received your request for ${price.description.toLowerCase()} ${when}. We're finding a vetted professional now and will email you as soon as one accepts.`
    : `We've received your booking for ${price.description.toLowerCase()} ${when}. We'll email you to confirm your team member and arrival window.`;

  await sendEmail(service_, {
    to: session.user.email!,
    bookingId: booking.id,
    subject: `${isContractor ? "Request received" : "Booking received"}: ${service.name} (${reference})`,
    text: [
      `Hi ${session.profile.first_name || "there"},`, "", message, "",
      `Reference: ${reference}`, `Service: ${price.description}`, `When: ${when}`, `Address: ${addressLine}, ${coverage.postcode}`,
      `Price: £${(price.totalPence / 100).toFixed(2)}`,
      ...(tasks.length ? [`Tasks (in priority order): ${tasks.join("; ")}`] : []),
      "", SITE.noPayment, SITE.cancellation, "Arrival times are estimates and may change. We'll update you if anything changes.", "",
      "You can follow this booking in your Everkind account.", `Questions? Email ${SITE.email}.`, "Everkind",
    ].join("\n"),
  });

  return NextResponse.json({ reference, status, message });
}
