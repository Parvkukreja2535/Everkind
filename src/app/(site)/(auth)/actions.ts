"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/forms";
import { homeFor, safeNext, type Role } from "@/lib/auth";
import { SITE_URL } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

const NOT_CONNECTED: FormState = { message: "Accounts aren't switched on yet. Please try again later." };
const fieldErrors = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));

const Password = z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.").regex(/[0-9]/, "Include at least one number.");

const Register = z.object({
  first_name: z.string().trim().min(1, "Enter your first name.").max(80),
  last_name: z.string().trim().min(1, "Enter your last name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, "Enter a valid phone number."),
  password: Password,
  confirm: z.string(),
  terms: z.literal("on", { message: "You need to accept the terms to create an account." }),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Register.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const supabase = await supabaseServer();
  if (!supabase) return NOT_CONNECTED;
  const d = parsed.data;
  const next = safeNext(form.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    // Only harmless profile details go in metadata; the database ignores any "role" sent here.
    options: { data: { first_name: d.first_name, last_name: d.last_name, phone: d.phone }, emailRedirectTo: `${SITE_URL}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { errors: { email: "An account with this email already exists. Try logging in." } };
    if (/password/i.test(error.message)) return { errors: { password: error.message } };
    return { message: "We couldn't create your account just now. Please try again." };
  }
  if (data.session) redirect(next); // email confirmation switched off in Supabase
  return { ok: true, message: `Nearly done. We've sent a confirmation link to ${d.email}. Open it to activate your account, then log in.` };
}

const Login = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address."), password: z.string().min(1, "Enter your password.") });

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Login.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const supabase = await supabaseServer();
  if (!supabase) return NOT_CONNECTED;
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (/confirm/i.test(error?.message ?? "")) return { message: "Please confirm your email first. Check your inbox for the link we sent." };
    if (/banned/i.test(error?.message ?? "")) return { message: "This account has been suspended. Please contact us." };
    return { message: "That email and password don't match. Check them and try again." };
  }
  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", data.user.id).single();
  if (profile?.status === "suspended") {
    await supabase.auth.signOut();
    return { message: "This account has been suspended. Please contact us." };
  }
  const fallback = homeFor((profile?.role ?? "customer") as Role);
  redirect(safeNext(form.get("next"), fallback));
}

export async function forgotPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { errors: { email: "Enter a valid email address." } };
  const supabase = await supabaseServer();
  if (!supabase) return NOT_CONNECTED;
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${SITE_URL}/auth/confirm?next=/reset-password` });
  // Same message whether or not the account exists, so the form can't be used to find accounts.
  return { ok: true, message: `If an account exists for ${email.data}, we've emailed a link to reset your password.` };
}

const Reset = z.object({ password: Password, confirm: z.string() }).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Reset.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const supabase = await supabaseServer();
  if (!supabase) return NOT_CONNECTED;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { message: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: /different/i.test(error.message) ? "Choose a password you haven't used before." : "We couldn't update your password. Request a new link and try again." };
  return { ok: true, message: "Your password has been changed. You're logged in." };
}
