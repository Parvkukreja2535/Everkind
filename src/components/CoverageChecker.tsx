"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { checkCoverage, COVERAGE, type CoverageResult } from "@/lib/coverage";

export function CoverageChecker({ compact = false }: { compact?: boolean }) {
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(await checkCoverage(postcode));
    setBusy(false);
  }

  return (
    <div className={compact ? "" : "card p-5"}>
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2" aria-label="Check your postcode">
        <label htmlFor="coverage-postcode" className="sr-only">Your postcode</label>
        <div className="flex h-12 min-w-0 flex-1 basis-56 items-center gap-2 rounded-ctl border border-line bg-white px-3 focus-within:border-green">
          <MapPin size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
          <input id="coverage-postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Enter your postcode, e.g. EC2V 7HH" autoComplete="postal-code" className="w-full min-w-0 bg-transparent outline-none" />
        </div>
        <button type="submit" className="btn-primary h-12" disabled={busy}>{busy ? "Checking…" : "Check area"}</button>
      </form>
      <div aria-live="polite" className="mt-3 text-sm">
        {result?.status === "covered" && <p className="text-status-ok"><b>Good news: we cover {result.postcode}.</b> It's about {result.miles.toFixed(1)} miles from {COVERAGE.centre.name}.</p>}
        {result?.status === "outside" && <p className="text-status-warn"><b>{result.postcode} is outside our launch area</b> ({result.miles.toFixed(1)} miles from {COVERAGE.centre.name}; we currently cover {COVERAGE.radiusMiles} miles). Register interest on any service page and we'll let you know when we reach you.</p>}
        {(result?.status === "invalid" || result?.status === "error") && <p className="text-status-err">{result.message}</p>}
        {!result && <p className="text-text-muted">We currently cover a {COVERAGE.radiusMiles}-mile radius from {COVERAGE.centre.name}.</p>}
      </div>
    </div>
  );
}
