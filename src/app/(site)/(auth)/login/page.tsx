import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor, safeNext } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; suspended?: string; reset?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session && session.profile.status === "active") redirect(safeNext(sp.next, homeFor(session.profile.role)));
  const notice = sp.suspended ? "This account has been suspended. Please contact us." : undefined;
  return (
    <>
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-3 text-4xl">Log in to Everkind</h1>
      <p className="mt-2 text-text-muted">Customers, professionals and the Everkind team all log in here.</p>
      <div className="mt-8"><LoginForm next={safeNext(sp.next, "")} notice={notice} /></div>
      <p className="mt-6 text-sm text-text-muted">New to Everkind? <Link href={`/register${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`} className="link">Create an account</Link></p>
      <p className="mt-2 text-sm text-text-muted">Want to work with us? <Link href="/work-with-everkind" className="link">Apply as a professional</Link></p>
    </>
  );
}
