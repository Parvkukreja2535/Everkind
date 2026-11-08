"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Field, FormMessage, Submit, TextArea, type FormState } from "@/components/forms";
import { saveOptionAction, saveServiceAction } from "../actions";

export interface EditableService {
  id?: string; slug?: string; name: string; category_id: string; summary: string; included: string[]; excluded: string[]; checks: string; keywords: string[];
  image_url: string; availability: string; workforce: string; price_type: string; price_pence: number | null; price_note: string; extra_hour_pence: number | null;
  min_hours: number | null; hours_options: number[] | null; duration_minutes: number; is_active: boolean; compliance_approved: boolean;
}
const p = (v: number | null) => (v == null ? "" : (v / 100).toFixed(v % 100 ? 2 : 0));
const Select = ({ label, name, value, children, error, onChange }: { label: string; name: string; value: string; children: React.ReactNode; error?: string; onChange?: (v: string) => void }) => (
  <div><label htmlFor={`f-${name}`} className="label">{label}</label><select id={`f-${name}`} name={name} defaultValue={value} onChange={(e) => onChange?.(e.target.value)} className="input">{children}</select>{error && <p className="mt-1 text-sm text-status-err">{error}</p>}</div>
);

export function ServiceEditor({ service, categories }: { service: EditableService; categories: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveServiceAction.bind(null, service.id ?? null), {});
  const [priceType, setPriceType] = useState(service.price_type);
  const [workforce, setWorkforce] = useState(service.workforce);
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-6" noValidate>
      <FormMessage state={state} />
      <section className="card grid gap-4 p-5">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Service name" name="name" defaultValue={service.name} error={e.name} />
          {service.id ? <div><span className="label">Web address</span><p className="input flex items-center bg-surface text-text-muted">/services/…/{service.slug}</p></div>
            : <Field label="Web address (optional)" name="slug" placeholder="made from the name if left blank" />}
          <Select label="Category" name="category_id" value={service.category_id} error={e.category_id}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          <Select label="Who does the work" name="workforce" value={service.workforce} onChange={setWorkforce}>
            <option value="employed">Everkind employees</option><option value="contractor">Independent contractors</option><option value="regulated">Regulated specialists (registration required)</option>
          </Select>
        </div>
        <TextArea label="Short description" name="summary" rows={2} maxLength={400} defaultValue={service.summary} error={e.summary} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea label="What's included (one per line)" name="included" rows={6} defaultValue={service.included.join("\n")} hint="For Instant Clean these are the tasks customers can choose." />
          <TextArea label="Not included (one per line)" name="excluded" rows={6} defaultValue={service.excluded.join("\n")} />
        </div>
        <TextArea label="Checks and standards" name="checks" rows={2} defaultValue={service.checks} />
        <Field label="Search keywords (comma separated)" name="keywords" defaultValue={service.keywords.join(", ")} />
      </section>

      <section className="card grid gap-4 p-5">
        <h2 className="font-semibold">Photo</h2>
        <div className="flex flex-wrap items-start gap-4">
          {service.image_url && <span className="relative h-24 w-36 overflow-hidden rounded-lg bg-surface"><Image src={service.image_url} alt="" fill sizes="144px" className="object-cover" /></span>}
          <div className="grid min-w-[240px] flex-1 gap-3">
            <div><label htmlFor="f-image_file" className="label">Upload a new photo (JPG, PNG or WebP, up to 4 MB)</label><input id="f-image_file" name="image_file" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-ctl file:border-0 file:bg-green-tint file:px-4 file:py-2 file:font-semibold file:text-green" />{e.image_file && <p className="mt-1 text-sm text-status-err">{e.image_file}</p>}</div>
            <Field label="…or image address" name="image_url" defaultValue={service.image_url} hint="Leave as is to keep the current photo." />
          </div>
        </div>
      </section>

      <section className="card grid gap-4 p-5">
        <h2 className="font-semibold">Pricing and duration</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Pricing model" name="price_type" value={service.price_type} onChange={setPriceType}>
            <option value="fixed">Fixed price</option><option value="hourly">Hourly rate</option><option value="first_hour">First hour + extra time</option>
            <option value="from">Starting ("from") price</option><option value="callout">Callout / diagnosis fee</option><option value="not_priced">Not priced</option>
          </Select>
          <Field label={priceType === "hourly" ? "Hourly rate (£)" : priceType === "first_hour" ? "First hour (£)" : "Price (£)"} name="price" inputMode="decimal" defaultValue={p(service.price_pence)} error={e.price} />
          <Field label="Price note shown to customers" name="price_note" defaultValue={service.price_note} placeholder="e.g. per turnover" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Minimum booking (hours)" name="min_hours" inputMode="decimal" defaultValue={service.min_hours ?? ""} error={e.min_hours} hint={priceType === "hourly" ? "Required for hourly pricing." : "Optional."} />
          <Field label="Hour choices" name="hours_options" defaultValue={service.hours_options?.join(", ") ?? ""} error={e.hours_options} hint="e.g. 1, 1.5, 2, 3, 4" />
          <Field label="Extra hour (£)" name="extra_hour" inputMode="decimal" defaultValue={p(service.extra_hour_pence)} error={e.extra_hour} hint="Optional. For first-hour pricing." />
          <Field label="Typical duration (minutes)" name="duration_minutes" type="number" min={15} max={720} defaultValue={service.duration_minutes} error={e.duration_minutes} hint="Used to keep fixed-price jobs inside 8am–8pm." />
        </div>
      </section>

      <section className="card grid gap-4 p-5">
        <h2 className="font-semibold">Availability</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Website label" name="availability" value={service.availability} error={e.availability}>
            <option value="available_now">Available now (bookable)</option><option value="coming_soon">Coming soon</option><option value="planned">Planned</option><option value="subject_to_approval">Subject to approval</option>
          </Select>
          <div className="grid content-end gap-2">
            <label className="flex gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={service.is_active} className="accent-green" /> Show on the website</label>
            {workforce === "regulated" && <label className="flex gap-2 text-sm"><input type="checkbox" name="compliance_approved" defaultChecked={service.compliance_approved} className="accent-green" /> Compliance approval recorded (registrations, insurance and legal checks completed)</label>}
          </div>
        </div>
        <p className="text-xs text-text-muted">Only "Available now" services can be booked. Regulated services can't become bookable until compliance approval is recorded; the database enforces this too.</p>
      </section>
      <Submit className="btn-primary btn-lg justify-self-start" pending="Saving…">{service.id ? "Save changes" : "Create service"}</Submit>
    </form>
  );
}

export interface EditableOption { id: string; name: string; description: string; price_type: string; price_pence: number; price_note: string; min_hours: number | null; is_active: boolean }

export function OptionEditor({ serviceId, option }: { serviceId: string; option?: EditableOption }) {
  const [state, action] = useActionState<FormState, FormData>(saveOptionAction.bind(null, serviceId, option?.id ?? null), {});
  return (
    <form action={action} className="grid gap-3 rounded-ctl border border-line p-4">
      <FormMessage state={state} />
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_.8fr_.8fr]">
        <Field label="Option name" name="name" defaultValue={option?.name} />
        <div><label className="label" htmlFor={`pt-${option?.id ?? "new"}`}>Pricing</label><select id={`pt-${option?.id ?? "new"}`} name="price_type" defaultValue={option?.price_type ?? "fixed"} className="input"><option value="fixed">Fixed</option><option value="hourly">Hourly</option><option value="first_hour">First hour</option><option value="from">From</option></select></div>
        <Field label="Price (£)" name="price" inputMode="decimal" defaultValue={option ? p(option.price_pence) : ""} />
        <Field label="Min hours" name="min_hours" inputMode="decimal" defaultValue={option?.min_hours ?? ""} />
      </div>
      <Field label="Description" name="description" defaultValue={option?.description} />
      <Field label="Price note" name="price_note" defaultValue={option?.price_note} />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={option?.is_active ?? true} className="accent-green" /> Offered</label>
        <Submit className="btn-secondary btn-sm" pending="Saving…">{option ? "Save option" : "Add option"}</Submit>
      </div>
    </form>
  );
}
