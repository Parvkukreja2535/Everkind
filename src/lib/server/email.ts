import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Email {
  to: string;
  subject: string;
  text: string;
  bookingId?: string;
}

/**
 * Every email is saved to `email_log` (the admin "Sent emails" log). It's delivered only
 * when RESEND_API_KEY is set and a verified sending domain exists (requirements v1.2 §17).
 */
export async function sendEmail(supabase: SupabaseClient, email: Email) {
  const from = process.env.EMAIL_FROM ?? "Everkind <hello@everkind.example>";
  let status: "logged" | "sent" | "failed" = "logged";
  let providerId: string | null = null;
  let error: string | null = null;

  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (res.ok) { status = "sent"; providerId = data.id ?? null; } else { status = "failed"; error = data.message ?? `HTTP ${res.status}`; }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : "send failed";
    }
  }

  await supabase.from("email_log").insert({ to_address: email.to, from_address: from, subject: email.subject, body_text: email.text, booking_id: email.bookingId ?? null, status, provider_id: providerId, error });
  return status;
}
