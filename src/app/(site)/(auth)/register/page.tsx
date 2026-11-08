import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <p className="eyebrow">Create an account</p>
      <h1 className="display mt-3 text-4xl">Book and manage everything in one place</h1>
      <p className="mt-2 text-text-muted">Save your addresses, follow your bookings and see your history.</p>
      <div className="mt-8"><RegisterForm next={safeNext(next, "/account")} /></div>
      <p className="mt-6 text-sm text-text-muted">Already have an account? <Link href="/login" className="link">Log in</Link></p>
    </>
  );
}
