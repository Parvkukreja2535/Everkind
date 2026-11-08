import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabaseServer } from "./supabase/server";

export type Role = "customer" | "professional" | "admin";

export interface Profile {
  id: string;
  role: Role;
  status: "active" | "suspended";
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Session {
  user: User;
  profile: Profile;
}

/** The signed-in visitor and their profile, verified with Supabase (not just read from a cookie). */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  if (!profile) return null;
  return { user: data.user, profile: profile as Profile };
});

/** Any signed-in, active account. Suspended accounts are signed out and sent to /login. */
export async function requireUser(next = "/account"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (session.profile.status !== "active") redirect("/login?suspended=1");
  return session;
}

/** Admin-only pages and actions. Checks the role stored in the database on every call. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireUser("/admin");
  if (session.profile.role !== "admin") redirect("/account?denied=admin");
  return session;
}

export interface ProfessionalRecord {
  id: string;
  user_id: string;
  worker_type: "employed" | "contractor";
  status: "active" | "suspended";
  bio: string;
  home_postcode: string;
  approved_at: string;
}

/** Approved, active professionals only. Returns null (not a redirect) so /pro can show application status instead. */
export async function getProfessional(): Promise<{ session: Session; pro: ProfessionalRecord | null }> {
  const session = await requireUser("/pro");
  const supabase = (await supabaseServer())!;
  const { data } = await supabase.from("professionals").select("*").eq("user_id", session.user.id).maybeSingle();
  const pro = data && data.status === "active" ? (data as ProfessionalRecord) : null;
  return { session, pro };
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "professional" ? "/pro" : "/account";
}

/** Only allow redirects to paths on this site (prevents open redirects via ?next=). */
export function safeNext(next: unknown, fallback = "/account") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
