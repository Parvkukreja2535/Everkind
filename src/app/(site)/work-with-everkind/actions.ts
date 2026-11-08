"use server";

import { z } from "zod";
import type { FormState } from "@/components/forms";
import { getSession } from "@/lib/auth";
import { getCatalogue } from "@/lib/catalogue-data";
import { isValidPostcode, normalisePostcode } from "@/lib/coverage";
import { supabaseService } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

const fieldErrors = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
const CV_TYPES: Record<string, string> = { "application/pdf": "pdf", "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx" };
const MAX_CV = 4 * 1024 * 1024;

const Application = z.object({
  first_name: z.string().trim().min(1, "Enter your first name.").max(80),
  last_name: z.string().trim().min(1, "Enter your last name.").max(80),
  phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, "Enter a valid phone number."),
  home_postcode: z.string().trim().refine(isValidPostcode, "Enter a valid UK postcode."),
  services: z.array(z.string().max(80)).min(1, "Choose at least one service.").max(20),
  qualifications: z.string().trim().max(2000).default(""),
  experience: z.string().trim().min(10, "Tell us a little about your experience.").max(2000),
  employment_preference: z.enum(["employed", "self_employed", "either", "not_sure"]),
  availability: z.string().trim().min(3, "Tell us when you're usually available.").max(1000),
  introduction: z.string().trim().min(20, "Write a short introduction (at least a sentence or two).").max(1500),
  consent: z.literal("on", { message: "Please confirm you agree to us processing your application." }),
});
const NewAccount = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(72).regex(/[A-Za-z]/, "Include a letter.").regex(/[0-9]/, "Include a number."),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

export async function submitApplicationAction(_: FormState, form: FormData): Promise<FormState> {
  const service = supabaseService();
  const userDb = await supabaseServer();
  if (!service || !userDb) return { message: "Applications aren't open online yet. Please email us instead." };

  const parsed = Application.safeParse({ ...Object.fromEntries(form), services: form.getAll("services") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const d = parsed.data;

  // Only real services from the live catalogue can be chosen.
  const { services } = await getCatalogue();
  const valid = new Set(services.map((s) => s.slug));
  if (d.services.some((s) => !valid.has(s))) return { errors: { services: "Choose services from the list." } };

  const cv = form.get("cv");
  const hasCv = cv instanceof File && cv.size > 0;
  if (hasCv && !CV_TYPES[cv.type]) return { errors: { cv: "Upload your CV as a PDF or Word document." } };
  if (hasCv && cv.size > MAX_CV) return { errors: { cv: "Your CV must be 4 MB or smaller." } };

  // Who is applying? An existing signed-in account, or a new account created now.
  const session = await getSession();
  let userId = session?.user.id;
  let email = session?.user.email ?? "";
  let needsConfirmation = false;
  if (!session) {
    const acct = NewAccount.safeParse(Object.fromEntries(form));
    if (!acct.success) return { errors: fieldErrors(acct.error), message: "Please fix the highlighted fields." };
    const { data, error } = await userDb.auth.signUp({
      email: acct.data.email,
      password: acct.data.password,
      options: { data: { first_name: d.first_name, last_name: d.last_name, phone: d.phone }, emailRedirectTo: `${SITE_URL}/auth/confirm?next=/pro` },
    });
    // Supabase returns a user with no identities when the email is already registered.
    if (error || !data.user || data.user.identities?.length === 0) {
      return { errors: { email: "An account with this email already exists. Log in first, then apply." } };
    }
    userId = data.user.id;
    email = acct.data.email;
    needsConfirmation = !data.session;
  }
  if (session && session.profile.role !== "customer") return { message: "This account already has professional or admin access." };

  const { data: existing } = await service.from("professional_applications").select("id, status").eq("user_id", userId!).maybeSingle();
  if (existing) return { message: "You've already applied. Log in and open the professional portal to see its status." };

  let cvPath: string | null = null;
  if (hasCv) {
    cvPath = `${userId}/cv-${Date.now()}.${CV_TYPES[cv.type]}`;
    const up = await service.storage.from("professional-documents").upload(cvPath, cv, { contentType: cv.type, upsert: false });
    if (up.error) return { message: "We couldn't upload your CV. Please try again, or apply without it and add it later." };
  }

  const { data: app, error } = await service.from("professional_applications").insert({
    user_id: userId, first_name: d.first_name, last_name: d.last_name, email, phone: d.phone,
    home_postcode: normalisePostcode(d.home_postcode), services: d.services, qualifications: d.qualifications,
    experience: d.experience, employment_preference: d.employment_preference, availability: d.availability,
    introduction: d.introduction, cv_path: cvPath, consent_at: new Date().toISOString(),
  }).select("id").single();
  if (error || !app) return { message: "We couldn't save your application. Please try again." };

  await service.from("application_events").insert({ application_id: app.id, status: "submitted", note: "Application submitted online", actor_id: userId });
  if (cvPath) await service.from("professional_documents").insert({ user_id: userId, doc_type: "cv", title: "CV", file_path: cvPath });

  return {
    ok: true,
    message: needsConfirmation
      ? `Thank you, ${d.first_name}. Your application has been submitted. We've emailed ${email} a link to confirm your account; after that you can log in to track your application's status.`
      : `Thank you, ${d.first_name}. Your application has been submitted. You can track its status in the professional portal.`,
  };
}
