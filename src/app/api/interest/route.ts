import { NextResponse } from "next/server";
import { z } from "zod";
import { getService } from "@/lib/catalogue";
import { normalisePostcode } from "@/lib/coverage";
import { db } from "@/lib/server/db";

const Body = z.object({
  serviceSlug: z.string().max(80),
  email: z.string().trim().email().max(200),
  postcode: z.string().trim().max(10).optional().nullable(),
  consent: z.literal(true),
  marketing: z.boolean(),
});

const CONSENT_TEXT = "Email me when this service becomes available in my area. I can unsubscribe at any time.";

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter your email and tick the first box to register interest." }, { status: 400 });
  const b = parsed.data;
  const service = getService(b.serviceSlug);
  if (!service || service.availability === "available_now") return NextResponse.json({ message: "This service is already bookable." }, { status: 400 });

  const supabase = db();
  if (!supabase) return NextResponse.json({ message: "Sign-ups aren't switched on yet. Please check back soon." }, { status: 503 });

  const { error } = await supabase.from("service_interest").insert({
    service_slug: service.slug,
    email: b.email.toLowerCase(),
    postcode: b.postcode ? normalisePostcode(b.postcode) : null,
    consent_text: CONSENT_TEXT,
    marketing_opt_in: b.marketing,
    source: "service_page",
  });
  // 23505 = already signed up for this service: treat as success.
  if (error && error.code !== "23505") return NextResponse.json({ message: "We couldn't save that. Please try again." }, { status: 500 });
  return NextResponse.json({ message: "Thanks. We'll email you when this service becomes available in your area. We don't have a launch date yet." });
}
