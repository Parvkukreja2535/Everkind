"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/forms";
import { getProfessional, requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// Every action re-checks on the server that the caller is an APPROVED, ACTIVE professional.
// The database functions and RLS policies check again.
async function proDb() {
  const { pro, session } = await getProfessional();
  if (!pro) throw new Error("Not an approved professional");
  return { pro, session, db: (await supabaseServer())! };
}
const done = (path = "/pro") => revalidatePath(path, "layout");

export async function acceptJobAction(form: FormData) {
  const { db } = await proDb();
  await db.rpc("accept_booking", { p_booking: String(form.get("id")) });
  done();
}

export async function declineJobAction(form: FormData) {
  const { db } = await proDb();
  await db.rpc("decline_booking", { p_booking: String(form.get("id")) });
  done();
}

const NEXT_STATUS = z.enum(["on_the_way", "arrived", "in_progress", "completed"]);
export async function updateJobStatusAction(form: FormData) {
  const { db } = await proDb();
  const status = NEXT_STATUS.parse(form.get("status"));
  await db.rpc("pro_update_booking_status", { p_booking: String(form.get("id")), p_status: status });
  done();
}

const Slot = z.object({ weekday: z.coerce.number().int().min(0).max(6), start_time: z.string().regex(/^\d{2}:\d{2}$/), end_time: z.string().regex(/^\d{2}:\d{2}$/) })
  .refine((s) => s.start_time >= "08:00" && s.end_time <= "20:00" && s.start_time < s.end_time, { message: "Choose times between 8:00am and 8:00pm, with the end after the start." });

export async function addAvailabilityAction(_: FormState, form: FormData): Promise<FormState> {
  const { pro, db } = await proDb();
  const parsed = Slot.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  const { error } = await db.from("professional_availability").insert({ ...parsed.data, professional_id: pro.id });
  if (error) return { message: "We couldn't save that time." };
  done("/pro/availability");
  return { ok: true, message: "Availability added." };
}

export async function deleteAvailabilityAction(form: FormData) {
  const { db } = await proDb();
  await db.from("professional_availability").delete().eq("id", String(form.get("id")));
  done("/pro/availability");
}

const TimeOff = z.object({ starts_on: z.string().date(), ends_on: z.string().date(), note: z.string().max(200).optional() }).refine((t) => t.starts_on <= t.ends_on, { message: "The end date must be on or after the start date." });

export async function addTimeOffAction(_: FormState, form: FormData): Promise<FormState> {
  const { pro, db } = await proDb();
  const parsed = TimeOff.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  const { error } = await db.from("professional_time_off").insert({ ...parsed.data, professional_id: pro.id });
  if (error) return { message: "We couldn't save that time off." };
  done("/pro/availability");
  return { ok: true, message: "Time off added." };
}

export async function deleteTimeOffAction(form: FormData) {
  const { db } = await proDb();
  await db.from("professional_time_off").delete().eq("id", String(form.get("id")));
  done("/pro/availability");
}

export async function updateBioAction(_: FormState, form: FormData): Promise<FormState> {
  const { pro, db } = await proDb();
  const bio = String(form.get("bio") ?? "").slice(0, 1500);
  const { error } = await db.from("professionals").update({ bio }).eq("id", pro.id);
  if (error) return { message: "We couldn't save your introduction." };
  done("/pro/profile");
  return { ok: true, message: "Saved." };
}

const DOC_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx" };
const Doc = z.object({ doc_type: z.enum(["qualification", "insurance", "id", "right_to_work", "dbs", "other"]), title: z.string().trim().min(1, "Give the document a name.").max(120), expires_on: z.string().date().optional().or(z.literal("")) });

export async function uploadDocumentAction(_: FormState, form: FormData): Promise<FormState> {
  const { session, db } = await proDb();
  const parsed = Doc.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { message: "Choose a file to upload." };
  if (!DOC_TYPES[file.type]) return { message: "Upload a PDF, Word document, JPG or PNG." };
  if (file.size > 4 * 1024 * 1024) return { message: "Files must be 4 MB or smaller." };
  // Uploaded AS the professional: storage rules only allow their own folder.
  const path = `${session.user.id}/${parsed.data.doc_type}-${Date.now()}.${DOC_TYPES[file.type]}`;
  const up = await db.storage.from("professional-documents").upload(path, file, { contentType: file.type });
  if (up.error) return { message: "We couldn't upload that file." };
  const { error } = await db.from("professional_documents").insert({ user_id: session.user.id, doc_type: parsed.data.doc_type, title: parsed.data.title, expires_on: parsed.data.expires_on || null, file_path: path });
  if (error) return { message: "We couldn't save that document." };
  done("/pro/profile");
  return { ok: true, message: "Document uploaded. Our team will verify it.", ts: Date.now() };
}

export async function respondToInfoAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("/pro");
  const db = (await supabaseServer())!;
  const response = String(form.get("response") ?? "").trim();
  if (response.length < 3) return { message: "Write your response before sending." };
  const { data, error } = await db.rpc("respond_to_info_request", { p_response: response.slice(0, 2000) });
  if (error || !data) return { message: "We couldn't send your response." };
  done();
  return { ok: true, message: "Thanks. Your response has been sent and your application is back under review." };
}
