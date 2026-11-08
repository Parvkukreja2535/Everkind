"use client";

import { useActionState, useState } from "react";
import { FormMessage, Submit, type FormState } from "@/components/forms";
import { quickPriceAction } from "../actions";

export function QuickPrice({ id, pricePence, priceType, minHours, hoursOptions, extraHourPence, compact = true }: { id: string; pricePence: number | null; priceType: string; minHours: number | null; hoursOptions: number[] | null; extraHourPence: number | null; compact?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(quickPriceAction.bind(null, id), {});
  const [rate, setRate] = useState(pricePence == null ? "" : String(pricePence / 100));
  const [opts, setOpts] = useState(hoursOptions?.join(", ") ?? "");
  const hourly = priceType === "hourly";
  const preview = hourly ? opts.split(/[,\s]+/).map(Number).filter((h) => h > 0) : [];
  return (
    <form action={action} className={compact ? "flex flex-wrap items-end gap-2" : "grid gap-4"}>
      <div className={compact ? "w-28" : ""}><label className={compact ? "sr-only" : "label"} htmlFor={`p-${id}`}>{hourly ? "Hourly rate (£)" : priceType === "first_hour" ? "First hour (£)" : "Price (£)"}</label><input id={`p-${id}`} name="price" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="input h-9" /></div>
      {hourly && (
        <>
          <div className={compact ? "w-24" : ""}><label className={compact ? "sr-only" : "label"} htmlFor={`m-${id}`}>Minimum hours</label><input id={`m-${id}`} name="min_hours" inputMode="decimal" defaultValue={minHours ?? ""} placeholder="min h" className="input h-9" /></div>
          <div className={compact ? "w-36" : ""}><label className={compact ? "sr-only" : "label"} htmlFor={`o-${id}`}>Hour choices</label><input id={`o-${id}`} name="hours_options" value={opts} onChange={(e) => setOpts(e.target.value)} placeholder="1, 1.5, 2" className="input h-9" /></div>
        </>
      )}
      {priceType === "first_hour" && <div className={compact ? "w-28" : ""}><label className={compact ? "sr-only" : "label"} htmlFor={`x-${id}`}>Extra hour (£)</label><input id={`x-${id}`} name="extra_hour" inputMode="decimal" defaultValue={extraHourPence == null ? "" : extraHourPence / 100} placeholder="extra £/h" className="input h-9" /></div>}
      <Submit className="btn-primary btn-sm" pending="Saving…">Save</Submit>
      {!compact && hourly && preview.length > 0 && Number(rate) > 0 && (
        <p className="text-sm text-text-muted">Customers will see: {preview.map((h) => `${h}h = £${(Number(rate) * h).toFixed(Number(rate) * h % 1 ? 2 : 0)}`).join(" · ")}</p>
      )}
      <div className="basis-full"><FormMessage state={state} /></div>
    </form>
  );
}
