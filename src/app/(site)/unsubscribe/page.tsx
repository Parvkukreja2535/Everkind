import type { Metadata } from "next";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

async function unsubscribe(token: string | undefined) {
  const t = z.string().uuid().safeParse(token);
  const db = supabaseService();
  if (!t.success || !db) return false;
  const { data } = await db.from("service_interest").update({ unsubscribed_at: new Date().toISOString() }).eq("unsubscribe_token", t.data).is("unsubscribed_at", null).select("id");
  return (data ?? []).length > 0;
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const ok = await unsubscribe((await searchParams).t);
  return (
    <div className="wrap max-w-[640px] py-24">
      <h1 className="display text-4xl">{ok ? "You've been unsubscribed" : "Link not recognised"}</h1>
      <p className="mt-4 text-text-muted">{ok ? "We won't email you about that service again." : "This unsubscribe link has already been used or isn't valid. Email us if you're still receiving messages."}</p>
    </div>
  );
}
