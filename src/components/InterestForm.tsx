"use client";

import Link from "next/link";
import { useState } from "react";
import type { Service } from "@/lib/catalogue";

export function InterestForm({ service }: { service: Service }) {
  const [state, setState] = useState<{ kind: "idle" | "ok" | "error"; message?: string }>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const gated = service.availability === "subject_to_approval";
  const cta = service.availability === "coming_soon" ? "Notify me" : "Register interest";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSlug: service.slug, email: f.get("email"), postcode: f.get("postcode"), consent: f.get("consent") === "on", marketing: f.get("marketing") === "on" }),
      });
      const data = await res.json();
      setState(res.ok ? { kind: "ok", message: data.message } : { kind: "error", message: data.message });
    } catch {
      setState({ kind: "error", message: "We couldn't send that. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === "ok") return <p className="rounded-ctl bg-green-tint p-4 text-sm text-status-ok" aria-live="polite">{state.message}</p>;

  return (
    <form onSubmit={onSubmit} className="grid gap-3" aria-label={cta}>
      <div><label htmlFor="i-email" className="label">Email</label><input id="i-email" name="email" type="email" required className="input" autoComplete="email" /></div>
      <div><label htmlFor="i-postcode" className="label">Postcode <span className="font-normal text-text-muted">(optional)</span></label><input id="i-postcode" name="postcode" className="input" autoComplete="postal-code" /></div>
      <label className="flex gap-3 text-sm text-text-muted"><input type="checkbox" name="consent" required className="mt-1 accent-green" /><span>Email me when {service.name.toLowerCase()} becomes available in my area. I can unsubscribe at any time. See the <Link href="/legal/privacy" className="link font-normal">privacy notice</Link>.</span></label>
      <label className="flex gap-3 text-sm text-text-muted"><input type="checkbox" name="marketing" className="mt-1 accent-green" /><span>Also send me occasional Everkind news (optional).</span></label>
      {state.kind === "error" && <p role="alert" className="text-sm text-status-err">{state.message}</p>}
      <button type="submit" className="btn-primary mt-1 w-full" disabled={busy}>{busy ? "Sending…" : gated ? "Register interest" : cta}</button>
    </form>
  );
}
