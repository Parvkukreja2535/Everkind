"use client";

import { useActionState } from "react";
import { FormMessage, Submit, type FormState } from "@/components/forms";
import { addAvailabilityAction, addTimeOffAction, respondToInfoAction, updateBioAction, uploadDocumentAction } from "./actions";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = Array.from({ length: 25 }, (_, i) => { const m = 8 * 60 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; });

export function RespondForm() {
  const [state, action] = useActionState<FormState, FormData>(respondToInfoAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-3">
      <FormMessage state={state} />
      <label htmlFor="response" className="label">Your response</label>
      <textarea id="response" name="response" rows={4} maxLength={2000} className="input h-auto py-2" />
      <Submit className="btn-primary justify-self-start" pending="Sending…">Send response</Submit>
    </form>
  );
}

export function AvailabilityForm() {
  const [state, action] = useActionState<FormState, FormData>(addAvailabilityAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
      <div className="sm:col-span-4"><FormMessage state={state} /></div>
      <div><label htmlFor="weekday" className="label">Day</label><select id="weekday" name="weekday" className="input">{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
      <div><label htmlFor="start_time" className="label">From</label><select id="start_time" name="start_time" className="input" defaultValue="09:00">{TIMES.slice(0, -1).map((t) => <option key={t}>{t}</option>)}</select></div>
      <div><label htmlFor="end_time" className="label">To</label><select id="end_time" name="end_time" className="input" defaultValue="17:00">{TIMES.slice(1).map((t) => <option key={t}>{t}</option>)}</select></div>
      <Submit className="btn-primary" pending="Adding…">Add</Submit>
    </form>
  );
}

export function TimeOffForm() {
  const [state, action] = useActionState<FormState, FormData>(addTimeOffAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
      <div className="sm:col-span-4"><FormMessage state={state} /></div>
      <div><label htmlFor="starts_on" className="label">From</label><input id="starts_on" name="starts_on" type="date" className="input" required /></div>
      <div><label htmlFor="ends_on" className="label">To</label><input id="ends_on" name="ends_on" type="date" className="input" required /></div>
      <div><label htmlFor="note" className="label">Note (optional)</label><input id="note" name="note" className="input" maxLength={200} /></div>
      <Submit className="btn-secondary" pending="Adding…">Add time off</Submit>
    </form>
  );
}

export function BioForm({ bio }: { bio: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateBioAction, {});
  return (
    <form action={action} className="grid gap-3">
      <FormMessage state={state} />
      <label htmlFor="bio" className="label">Short introduction (shared with customers once you're assigned)</label>
      <textarea id="bio" name="bio" rows={4} maxLength={1500} defaultValue={bio} className="input h-auto py-2" />
      <Submit className="btn-secondary justify-self-start" pending="Saving…">Save</Submit>
    </form>
  );
}

export function DocumentForm() {
  const [state, action] = useActionState<FormState, FormData>(uploadDocumentAction, {});
  return (
    <form action={action} className="grid gap-3" key={state.ts ?? 0}>
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="doc_type" className="label">Type</label>
          <select id="doc_type" name="doc_type" className="input">
            <option value="qualification">Qualification</option><option value="insurance">Insurance</option><option value="id">Photo ID</option>
            <option value="right_to_work">Right to work</option><option value="dbs">DBS certificate</option><option value="other">Other</option>
          </select></div>
        <div><label htmlFor="title" className="label">Name</label><input id="title" name="title" className="input" maxLength={120} placeholder="e.g. Public liability insurance" /></div>
      </div>
      <div><label htmlFor="expires_on" className="label">Expiry date (if any)</label><input id="expires_on" name="expires_on" type="date" className="input" /></div>
      <div><label htmlFor="file" className="label">File (PDF, Word, JPG or PNG, up to 4 MB)</label><input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="block w-full text-sm file:mr-3 file:rounded-ctl file:border-0 file:bg-green-tint file:px-4 file:py-2 file:font-semibold file:text-green" /></div>
      <Submit className="btn-primary justify-self-start" pending="Uploading…">Upload document</Submit>
    </form>
  );
}
