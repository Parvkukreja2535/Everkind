import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Server-only client with the service role key. It bypasses Row Level Security, so it is
 * used ONLY for actions the server has already authorised itself: saving a booking with a
 * server-calculated price, saving an application/CV for a just-created account, the email
 * log and account suspension. Never import this from client components.
 */
export function supabaseService(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

export const NOT_CONNECTED_MESSAGE =
  "Online booking isn't switched on yet. Please email hello@everkind.example and we'll arrange it for you.";
