"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/forms";
import { requireAdmin } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/supabase/config";
import { sendEmail } from "@/lib/server/email";
import { SITE } from "@/lib/site";
import { londonToUtcIso } from "@/lib/booking";

// SECURITY: every action starts with requireAdmin(), which re-reads the caller's role from the
// database. Queries then run AS that admin (not with the service key), so Row Level Security
// enforces admin-only access a second time. Price/service changes are written to the audit log
// by database triggers, with the admin as the actor.
async function admin() {
  const session = await requireAdmin();
  return { session, db: (await supabaseServer())! };
}
const refreshSite = () => revalidatePath("/", "layout");
const errs = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path.join(".")), i.message]));
const lines = (v: FormDataEntryValue | null) => String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
const pounds = (v: FormDataEntryValue | null) => { const s = String(v ?? "").trim(); if (!s) return null; const n = Math.round(Number(s) * 100); return Number.isFinite(n) && n >= 0 ? n : NaN; };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
async function uploadImage(db: NonNullable<Awaited<ReturnType<typeof supabaseServer>>>, file: FormDataEntryValue | null, folder: string) {
  if (!(file instanceof File) || !file.size) return { url: null as string | null };
  if (!IMAGE_TYPES[file.type]) return { error: "Images must be JPG, PNG or WebP." };
  if (file.size > 4 * 1024 * 1024) return { error: "Images must be 4 MB or smaller." };
  const path = `${folder}/${Date.now()}.${IMAGE_TYPES[file.type]}`;
  const up = await db.storage.from("catalogue-images").upload(path, file, { contentType: file.type });
  if (up.error) return { error: "The image couldn't be uploaded." };
  return { url: db.storage.from("catalogue-images").getPublicUrl(path).data.publicUrl };
}

// ------------------------------------------------------------------ services
const ServiceForm = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(120),
  category_id: z.string().uuid("Choose a category."),
  summary: z.string().trim().max(400),
  checks: z.string().trim().max(2000),
  availability: z.enum(["available_now", "coming_soon", "planned", "subject_to_approval"]),
  workforce: z.enum(["employed", "contractor", "regulated"]),
  price_type: z.enum(["fixed", "hourly", "first_hour", "from", "callout", "not_priced"]),
  price_note: z.string().trim().max(200),
  duration_minutes: z.coerce.number().int().min(15, "At least 15 minutes.").max(720),
  is_active: z.boolean(),
  compliance_approved: z.boolean(),
});

function parseService(form: FormData) {
  const base = ServiceForm.safeParse({ ...Object.fromEntries(form), is_active: form.get("is_active") === "on", compliance_approved: form.get("compliance_approved") === "on" });
  if (!base.success) return { errors: errs(base.error) };
  const price_pence = pounds(form.get("price"));
  const extra_hour_pence = pounds(form.get("extra_hour"));
  const minRaw = String(form.get("min_hours") ?? "").trim();
  const min_hours = minRaw ? Number(minRaw) : null;
  const hoursRaw = String(form.get("hours_options") ?? "").trim();
  const hours_options = hoursRaw ? hoursRaw.split(/[,\s]+/).map(Number) : null;
  const e: Record<string, string> = {};
  if (Number.isNaN(price_pence)) e.price = "Enter a price like 35 or 35.50.";
  if (Number.isNaN(extra_hour_pence)) e.extra_hour = "Enter an amount like 30.";
  if (min_hours != null && (!Number.isFinite(min_hours) || min_hours < 0.5 || min_hours > 12)) e.min_hours = "Between 0.5 and 12 hours.";
  if (hours_options && hours_options.some((h) => !Number.isFinite(h) || h < 0.5 || h > 12 || !Number.isInteger(h * 2))) e.hours_options = "Use half-hours between 0.5 and 12, e.g. 1, 1.5, 2, 3.";
  const d = base.data;
  if (d.price_type === "hourly" && min_hours == null) e.min_hours = "Hourly services need a minimum booking length.";
  if (d.price_type === "hourly" && hours_options && min_hours != null && hours_options.some((h) => h < min_hours)) e.hours_options = "Options can't be shorter than the minimum.";
  if (d.availability === "available_now" && (d.price_type === "not_priced" || price_pence == null)) e.price = "A bookable service needs a price.";
  if (d.workforce === "regulated" && d.availability === "available_now" && !d.compliance_approved) e.availability = "Regulated services can't be bookable until compliance approval is recorded.";
  if (Object.keys(e).length) return { errors: e };
  return {
    data: {
      ...d, price_pence, extra_hour_pence, min_hours, hours_options: hours_options?.sort((a, b) => a - b) ?? null,
      included: lines(form.get("included")), excluded: lines(form.get("excluded")),
      keywords: String(form.get("keywords") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 30),
    },
  };
}

export async function saveServiceAction(serviceId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const { session, db } = await admin();
  const parsed = parseService(form);
  if (!parsed.data) return { errors: parsed.errors, message: "Please fix the highlighted fields." };
  const img = await uploadImage(db, form.get("image_file"), "services");
  if (img.error) return { errors: { image_file: img.error } };
  const imageUrl = img.url ?? String(form.get("image_url") ?? "").trim();
  const row = {
    ...parsed.data,
    image_url: imageUrl,
    compliance_approved_by: parsed.data.compliance_approved ? session.user.id : null,
    compliance_approved_at: parsed.data.compliance_approved ? new Date().toISOString() : null,
  };
  if (serviceId) {
    const { error } = await db.from("services").update(row).eq("id", serviceId);
    if (error) return { message: `Couldn't save: ${error.message}` };
  } else {
    const slug = slugify(String(form.get("slug") || parsed.data.name));
    const { data: last } = await db.from("services").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await db.from("services").insert({ ...row, slug, sort_order: (last?.sort_order ?? 0) + 10 }).select("id").single();
    if (error) return { message: error.code === "23505" ? "A service with that web address already exists." : `Couldn't create: ${error.message}` };
    refreshSite();
    redirect(`/admin/services/${data.id}?created=1`);
  }
  refreshSite();
  return { ok: true, message: "Saved. The website now shows this change." };
}

export async function toggleServiceAction(form: FormData) {
  const { db } = await admin();
  await db.from("services").update({ is_active: form.get("active") === "true" }).eq("id", String(form.get("id")));
  refreshSite();
}

export async function moveServiceAction(form: FormData) {
  const { db } = await admin();
  const id = String(form.get("id"));
  const dir = form.get("dir") === "up" ? -1 : 1;
  const { data: me } = await db.from("services").select("id, sort_order, category_id").eq("id", id).single();
  if (!me) return;
  const q = db.from("services").select("id, sort_order").eq("category_id", me.category_id).is("archived_at", null);
  const { data: other } = await (dir < 0 ? q.lt("sort_order", me.sort_order).order("sort_order", { ascending: false }) : q.gt("sort_order", me.sort_order).order("sort_order")).limit(1).maybeSingle();
  if (!other) return;
  await db.from("services").update({ sort_order: other.sort_order }).eq("id", me.id);
  await db.from("services").update({ sort_order: me.sort_order }).eq("id", other.id);
  refreshSite();
}

export async function archiveServiceAction(form: FormData) {
  const { db } = await admin();
  const id = String(form.get("id"));
  const { data: svc } = await db.from("services").select("slug").eq("id", id).single();
  const { count } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("service_slug", svc?.slug ?? "");
  // Services with booking history are archived (kept for records); unused ones are deleted.
  if (count || form.get("mode") === "archive") await db.from("services").update({ archived_at: new Date().toISOString(), is_active: false }).eq("id", id);
  else await db.from("services").delete().eq("id", id);
  refreshSite();
  redirect("/admin/services?removed=1");
}

export async function restoreServiceAction(form: FormData) {
  const { db } = await admin();
  await db.from("services").update({ archived_at: null }).eq("id", String(form.get("id")));
  refreshSite();
}

const OptionForm = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400),
  price_type: z.enum(["fixed", "hourly", "first_hour", "from"]),
  price_note: z.string().trim().max(200),
});
export async function saveOptionAction(serviceId: string, optionId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const { db } = await admin();
  const parsed = OptionForm.safeParse(Object.fromEntries(form));
  const price_pence = pounds(form.get("price"));
  if (!parsed.success || price_pence == null || Number.isNaN(price_pence)) return { message: "Enter a name and a valid price for the option." };
  const minRaw = String(form.get("min_hours") ?? "").trim();
  const row = { ...parsed.data, price_pence, min_hours: minRaw ? Number(minRaw) : null, is_active: form.get("is_active") === "on" };
  const { error } = optionId
    ? await db.from("service_options").update(row).eq("id", optionId)
    : await db.from("service_options").insert({ ...row, service_id: serviceId, slug: slugify(parsed.data.name), sort_order: Date.now() % 100000 });
  if (error) return { message: `Couldn't save option: ${error.message}` };
  refreshSite();
  return { ok: true, message: "Option saved." };
}

// ------------------------------------------------------------------ pricing (quick edit)
export async function quickPriceAction(serviceId: string, _: FormState, form: FormData): Promise<FormState> {
  const { db } = await admin();
  const price_pence = pounds(form.get("price"));
  if (price_pence == null || Number.isNaN(price_pence)) return { message: "Enter a valid price." };
  const update: Record<string, unknown> = { price_pence };
  const minRaw = String(form.get("min_hours") ?? "").trim();
  if (form.has("min_hours")) update.min_hours = minRaw ? Number(minRaw) : null;
  if (form.has("hours_options")) {
    const raw = String(form.get("hours_options") ?? "").trim();
    update.hours_options = raw ? raw.split(/[,\s]+/).map(Number).sort((a, b) => a - b) : null;
  }
  if (form.has("extra_hour")) { const x = pounds(form.get("extra_hour")); if (Number.isNaN(x)) return { message: "Enter a valid extra-hour amount." }; update.extra_hour_pence = x; }
  const { error } = await db.from("services").update(update).eq("id", serviceId);
  if (error) return { message: error.message.includes("hourly_needs_minimum") ? "Hourly services need a minimum duration." : `Couldn't save: ${error.message}` };
  refreshSite();
  return { ok: true, message: "Price updated on the website." };
}

// ------------------------------------------------------------------ categories
const CategoryForm = z.object({ name: z.string().trim().min(2, "Enter a name.").max(80), description: z.string().trim().max(600) });
export async function saveCategoryAction(categoryId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const { db } = await admin();
  const parsed = CategoryForm.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error) };
  const img = await uploadImage(db, form.get("image_file"), "categories");
  if (img.error) return { message: img.error };
  const row: Record<string, unknown> = { ...parsed.data, is_active: form.get("is_active") === "on" };
  if (img.url) row.image_url = img.url;
  if (form.get("remove_image") === "on") row.image_url = null;
  if (categoryId) {
    const { error } = await db.from("categories").update(row).eq("id", categoryId);
    if (error) return { message: `Couldn't save: ${error.message}` };
  } else {
    const { data: last } = await db.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from("categories").insert({ ...row, slug: slugify(parsed.data.name), sort_order: (last?.sort_order ?? 0) + 10 });
    if (error) return { message: error.code === "23505" ? "A category with that name already exists." : `Couldn't create: ${error.message}` };
  }
  refreshSite();
  return { ok: true, message: "Category saved.", ts: Date.now() };
}

export async function moveCategoryAction(form: FormData) {
  const { db } = await admin();
  const id = String(form.get("id"));
  const up = form.get("dir") === "up";
  const { data: me } = await db.from("categories").select("id, sort_order").eq("id", id).single();
  if (!me) return;
  const q = db.from("categories").select("id, sort_order");
  const { data: other } = await (up ? q.lt("sort_order", me.sort_order).order("sort_order", { ascending: false }) : q.gt("sort_order", me.sort_order).order("sort_order")).limit(1).maybeSingle();
  if (!other) return;
  await db.from("categories").update({ sort_order: other.sort_order }).eq("id", me.id);
  await db.from("categories").update({ sort_order: me.sort_order }).eq("id", other.id);
  refreshSite();
}

// ------------------------------------------------------------------ professionals
const Decision = z.object({
  decision: z.enum(["under_review", "info_required", "approved", "rejected"]),
  note: z.string().trim().max(2000).optional(),
  worker_type: z.enum(["employed", "contractor"]).optional(),
});

export async function decideApplicationAction(applicationId: string, _: FormState, form: FormData): Promise<FormState> {
  const { session, db } = await admin();
  const parsed = Decision.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Choose a decision." };
  const d = parsed.data;
  const { data: app } = await db.from("professional_applications").select("*").eq("id", applicationId).single();
  if (!app) return { message: "Application not found." };
  if (app.status === "approved" && d.decision !== "approved") return { message: "This application is already approved. Suspend the professional instead." };
  if (d.decision === "info_required" && !d.note) return { message: "Write what information you need from the applicant." };

  if (d.decision === "approved") {
    if (!d.worker_type) return { message: "Choose whether they'll work as an employee or an independent contractor." };
    const serviceSlugs = form.getAll("services").map(String);
    if (!serviceSlugs.length) return { message: "Approve at least one service." };
    const { data: svc } = await db.from("services").select("id, slug, workforce").in("slug", serviceSlugs);
    // Keep the employed/contractor distinction: employees do employed services, contractors do contractor/regulated ones.
    const wrong = (svc ?? []).filter((s) => (d.worker_type === "employed" ? s.workforce !== "employed" : s.workforce === "employed"));
    if (wrong.length) return { message: `${d.worker_type === "employed" ? "Employees" : "Contractors"} can't be approved for: ${wrong.map((s) => s.slug).join(", ")}.` };
    const { data: pro, error } = await db.from("professionals").upsert({ user_id: app.user_id, application_id: app.id, worker_type: d.worker_type, status: "active", home_postcode: app.home_postcode, approved_by: session.user.id, approved_at: new Date().toISOString() }, { onConflict: "user_id" }).select("id").single();
    if (error || !pro) return { message: `Couldn't create the professional account: ${error?.message}` };
    await db.from("professional_services").delete().eq("professional_id", pro.id);
    await db.from("professional_services").insert((svc ?? []).map((s) => ({ professional_id: pro.id, service_id: s.id })));
    const { error: roleErr } = await db.from("profiles").update({ role: "professional" }).eq("id", app.user_id);
    if (roleErr) return { message: `Couldn't grant professional access: ${roleErr.message}` };
  }
  const { error } = await db.from("professional_applications").update({ status: d.decision, info_request: d.decision === "info_required" ? d.note : app.info_request }).eq("id", applicationId);
  if (error) return { message: `Couldn't update: ${error.message}` };
  await db.from("application_events").insert({ application_id: applicationId, status: d.decision, note: d.note || null, actor_id: session.user.id });

  const service = supabaseService();
  if (service && d.decision !== "under_review") {
    const body = {
      approved: `Good news: your application to work with Everkind has been approved. Log in and open the professional portal to set your availability and upload your documents.`,
      rejected: `Thank you for applying to work with Everkind. We're unable to offer work at the moment.${d.note ? `\n\n${d.note}` : ""}`,
      info_required: `We need a little more information about your application:\n\n${d.note}\n\nLog in and open the professional portal to reply.`,
    }[d.decision];
    await sendEmail(service, { to: app.email, subject: "Your Everkind application", text: `Hi ${app.first_name},\n\n${body}\n\nEverkind\n${SITE.email}` });
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Decision saved and recorded." };
}

export async function setProfessionalStatusAction(form: FormData) {
  const { db } = await admin();
  const status = form.get("status") === "suspended" ? "suspended" : "active";
  await db.from("professionals").update({ status }).eq("id", String(form.get("id")));
  revalidatePath("/admin", "layout");
}

export async function setProfessionalServicesAction(proId: string, _: FormState, form: FormData): Promise<FormState> {
  const { db } = await admin();
  const { data: pro } = await db.from("professionals").select("worker_type").eq("id", proId).single();
  const slugs = form.getAll("services").map(String);
  const { data: svc } = await db.from("services").select("id, workforce").in("slug", slugs.length ? slugs : ["-"]);
  const allowed = (svc ?? []).filter((s) => (pro?.worker_type === "employed" ? s.workforce === "employed" : s.workforce !== "employed"));
  await db.from("professional_services").delete().eq("professional_id", proId);
  if (allowed.length) await db.from("professional_services").insert(allowed.map((s) => ({ professional_id: proId, service_id: s.id })));
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${allowed.length} service${allowed.length === 1 ? "" : "s"} approved.` };
}

export async function verifyDocumentAction(form: FormData) {
  const { db } = await admin();
  await db.from("professional_documents").update({ verified: form.get("verified") === "true" }).eq("id", String(form.get("id")));
  revalidatePath("/admin", "layout");
}

// ------------------------------------------------------------------ customers
export async function setAccountStatusAction(form: FormData) {
  const { session, db } = await admin();
  const id = String(form.get("id"));
  if (id === session.user.id) return; // admins can't suspend themselves
  const status = form.get("status") === "suspended" ? "suspended" : "active";
  const { error } = await db.from("profiles").update({ status }).eq("id", id);
  // Also block sign-in at the authentication level (needs the server key).
  const service = supabaseService();
  if (!error && service) await service.auth.admin.updateUserById(id, { ban_duration: status === "suspended" ? "876000h" : "none" });
  revalidatePath("/admin", "layout");
}

// ------------------------------------------------------------------ bookings
export async function assignBookingAction(bookingId: string, _: FormState, form: FormData): Promise<FormState> {
  const { session, db } = await admin();
  const proId = String(form.get("professional_id") ?? "");
  const { data: b } = await db.from("bookings").select("*").eq("id", bookingId).single();
  if (!b) return { message: "Booking not found." };
  if (["completed", "cancelled_by_customer", "cancelled_by_everkind", "not_fulfilled"].includes(b.status)) return { message: "This booking is closed." };
  const { data: pro } = await db.from("professionals").select("id, worker_type, status").eq("id", proId).single();
  if (!pro || pro.status !== "active") return { message: "Choose an active professional." };
  const { data: ok } = await db.from("professional_services").select("service_id, services!inner(slug)").eq("professional_id", pro.id).eq("services.slug", b.service_slug);
  if (!ok?.length) return { message: "That professional isn't approved for this service." };

  if (b.workforce === "contractor") {
    // Contractors must accept themselves: the admin can only OFFER the job.
    if (pro.worker_type !== "contractor") return { message: "Contractor jobs can only be offered to independent contractors." };
    const { error } = await db.from("booking_assignments").insert({ booking_id: b.id, professional_id: pro.id, action: "offered", actor_id: session.user.id });
    if (error) return { message: error.code === "23505" ? "Already offered to this professional." : `Couldn't offer: ${error.message}` };
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Offered. The booking will be confirmed when they accept in their portal." };
  }
  if (pro.worker_type !== "employed") return { message: "Employed-service bookings can only be assigned to Everkind employees." };
  const start = String(form.get("window_start") ?? "");
  const update: Record<string, unknown> = { assigned_worker_id: pro.id, status: b.status === "requested" ? "confirmed" : b.status, confirmed_at: b.confirmed_at ?? new Date().toISOString() };
  if (/^\d{2}:\d{2}$/.test(start)) {
    // A one-hour arrival window, converted from UK time (handles British Summer Time).
    const [h, m] = start.split(":").map(Number);
    const end = `${String(Math.min(h + 1, 20)).padStart(2, "0")}:${h + 1 >= 20 ? "00" : String(m).padStart(2, "0")}`;
    update.arrival_window_start = londonToUtcIso(b.requested_date, start);
    update.arrival_window_end = londonToUtcIso(b.requested_date, end);
  }
  const { error } = await db.from("bookings").update(update).eq("id", b.id);
  if (error) return { message: `Couldn't assign: ${error.message}` };
  await db.from("booking_assignments").insert({ booking_id: b.id, professional_id: pro.id, action: "assigned", actor_id: session.user.id });
  const service = supabaseService();
  if (service && b.status === "requested") {
    await sendEmail(service, { to: b.customer_email, bookingId: b.id, subject: `Booking confirmed (${b.reference})`, text: `Hi ${b.customer_name.split(" ")[0]},\n\nYour booking ${b.reference} (${b.price_description}) on ${b.requested_date} is confirmed. Arrival times are estimates and may change.\n\n${SITE.noPayment}\n\nEverkind` });
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Assigned and confirmed." };
}

export async function unassignBookingAction(form: FormData) {
  const { session, db } = await admin();
  const id = String(form.get("id"));
  const { data: b } = await db.from("bookings").select("assigned_worker_id, workforce").eq("id", id).single();
  if (!b?.assigned_worker_id) return;
  await db.from("bookings").update({ assigned_worker_id: null, status: b.workforce === "contractor" ? "finding_professional" : "requested", arrival_window_start: null, arrival_window_end: null }).eq("id", id);
  await db.from("booking_assignments").insert({ booking_id: id, professional_id: b.assigned_worker_id, action: "unassigned", actor_id: session.user.id });
  revalidatePath("/admin", "layout");
}

export async function cancelBookingByAdminAction(bookingId: string, _: FormState, form: FormData): Promise<FormState> {
  const { db } = await admin();
  const reason = String(form.get("reason") ?? "").trim().slice(0, 300);
  if (!reason) return { message: "Give a reason (the customer will see it)." };
  const { data: b } = await db.from("bookings").select("status, customer_email, customer_name, reference, id").eq("id", bookingId).single();
  if (!b || ["completed", "cancelled_by_customer", "cancelled_by_everkind", "not_fulfilled"].includes(b.status)) return { message: "This booking can't be cancelled." };
  const { error } = await db.from("bookings").update({ status: "cancelled_by_everkind", cancelled_at: new Date().toISOString(), cancellation_reason: reason }).eq("id", bookingId);
  if (error) return { message: `Couldn't cancel: ${error.message}` };
  const service = supabaseService();
  if (service) await sendEmail(service, { to: b.customer_email, bookingId: b.id, subject: `Booking cancelled (${b.reference})`, text: `Hi ${b.customer_name.split(" ")[0]},\n\nWe're sorry, we've had to cancel booking ${b.reference}: ${reason}\n\nNo payment was taken. Reply to ${SITE.email} if you'd like to rebook.\n\nEverkind` });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Booking cancelled and the customer has been emailed." };
}

// ------------------------------------------------------------------ interest
export async function notifyInterestAction(form: FormData) {
  const { db } = await admin();
  const slug = String(form.get("service_slug"));
  const { data: svc } = await db.from("services").select("name, slug, availability, categories(slug)").eq("slug", slug).single();
  // Only email people about a service that is actually bookable now, and only those who consented and haven't unsubscribed.
  if (!svc || svc.availability !== "available_now") redirect("/admin/interest?notified=not-live");
  const { data: list } = await db.from("service_interest").select("id, email, unsubscribe_token").eq("service_slug", slug).is("unsubscribed_at", null);
  const service = supabaseService();
  if (service) {
    const cat = (svc.categories as unknown as { slug: string } | null)?.slug ?? "";
    for (const r of list ?? []) {
      await sendEmail(service, { to: r.email, subject: `${svc.name} is now available`, text: `Hello,\n\nYou asked us to tell you when ${svc.name.toLowerCase()} became available. You can now book it: ${SITE_URL}/services/${cat}/${svc.slug}\n\nDon't want these emails? Unsubscribe here: ${SITE_URL}/unsubscribe?t=${r.unsubscribe_token}\n\nEverkind` });
    }
  }
  redirect(`/admin/interest?notified=${(list ?? []).length}`);
}
