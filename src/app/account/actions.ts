"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { normalisePostcode, isValidPostcode } from "@/lib/coverage";
import { supabaseServer } from "@/lib/supabase/server";

const fieldErrors = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));

export async function cancelBookingAction(bookingId: string, _: FormState, form: FormData): Promise<FormState> {
  await requireUser("/account/bookings");
  const supabase = (await supabaseServer())!;
  const reason = String(form.get("reason") ?? "").slice(0, 300) || null;
  // The database function only cancels the caller's OWN booking, and only while it's still upcoming.
  const { data, error } = await supabase.rpc("cancel_my_booking", { p_booking: bookingId, p_reason: reason });
  if (error || !data) return { message: "This booking can't be cancelled online. Please email us." };
  revalidatePath("/account", "layout");
  return { ok: true, message: "Your booking has been cancelled. No fee has been charged." };
}

const Profile = z.object({
  first_name: z.string().trim().min(1, "Enter your first name.").max(80),
  last_name: z.string().trim().min(1, "Enter your last name.").max(80),
  phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, "Enter a valid phone number."),
});

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireUser("/account/profile");
  const parsed = Profile.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const supabase = (await supabaseServer())!;
  // Only these three columns are sent. Role/status changes are blocked by the database anyway.
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { message: "We couldn't save your details. Please try again." };
  revalidatePath("/account", "layout");
  return { ok: true, message: "Your details have been saved." };
}

const Address = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  line1: z.string().trim().min(3, "Enter the first line of the address.").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80).default("London"),
  postcode: z.string().trim().refine(isValidPostcode, "Enter a valid UK postcode."),
});

export async function addAddressAction(_: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireUser("/account/profile");
  const parsed = Address.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const supabase = (await supabaseServer())!;
  const { count } = await supabase.from("customer_addresses").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= 10) return { message: "You can save up to 10 addresses." };
  const { error } = await supabase.from("customer_addresses").insert({ ...parsed.data, line2: parsed.data.line2 || null, postcode: normalisePostcode(parsed.data.postcode), user_id: user.id, is_default: !count });
  if (error) return { message: "We couldn't save that address." };
  revalidatePath("/account/profile");
  return { ok: true, message: "Address saved.", ts: Date.now() };
}

export async function deleteAddressAction(form: FormData) {
  await requireUser("/account/profile");
  const supabase = (await supabaseServer())!;
  await supabase.from("customer_addresses").delete().eq("id", String(form.get("id"))); // RLS: own rows only
  revalidatePath("/account/profile");
}

const PasswordChange = z.object({
  current: z.string().min(1, "Enter your current password."),
  password: z.string().min(8, "Use at least 8 characters.").max(72).regex(/[A-Za-z]/, "Include a letter.").regex(/[0-9]/, "Include a number."),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireUser("/account/profile");
  const parsed = PasswordChange.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const supabase = (await supabaseServer())!;
  // Re-check the current password before changing it.
  const check = await supabase.auth.signInWithPassword({ email: user.email!, password: parsed.data.current });
  if (check.error) return { errors: { current: "That isn't your current password." } };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: "We couldn't change your password. Please try again." };
  return { ok: true, message: "Your password has been changed." };
}
