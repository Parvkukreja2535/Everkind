import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface BookingRow {
  id: string; reference: string; service_slug: string; option_slug: string | null; workforce: "employed" | "contractor" | "regulated"; status: string;
  asap: boolean; requested_date: string; requested_time: string | null; duration_minutes: number; hours: number | null; tasks: string[] | null;
  price_total_pence: number; price_description: string; customer_name: string; customer_email: string; customer_phone: string; address_line: string;
  postcode: string; notes: string | null; customer_id: string | null; assigned_worker_id: string | null; arrival_window_start: string | null;
  arrival_window_end: string | null; cancelled_at: string | null; cancellation_reason: string | null; created_at: string;
}

export async function serviceNames(supabase: SupabaseClient, slugs: string[]) {
  if (!slugs.length) return {} as Record<string, string>;
  const { data } = await supabase.from("services").select("slug, name").in("slug", [...new Set(slugs)]);
  return Object.fromEntries((data ?? []).map((s) => [s.slug, s.name])) as Record<string, string>;
}
