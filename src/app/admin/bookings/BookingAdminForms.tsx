"use client";

import { useActionState } from "react";
import { FormMessage, Submit, type FormState } from "@/components/forms";
import { assignBookingAction, cancelBookingByAdminAction } from "../actions";

export function AssignForm({ bookingId, contractor, options }: { bookingId: string; contractor: boolean; options: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(assignBookingAction.bind(null, bookingId), {});
  if (!options.length) return <p className="text-sm text-text-muted">No eligible {contractor ? "contractors" : "team members"} are approved for this service yet.</p>;
  return (
    <form action={action} className="grid gap-3">
      <FormMessage state={state} />
      <div><label htmlFor="professional_id" className="label">{contractor ? "Offer to contractor" : "Assign team member"}</label>
        <select id="professional_id" name="professional_id" className="input">{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
      {!contractor && <div><label htmlFor="window_start" className="label">Arrival window starts (1 hour, UK time)</label><input id="window_start" name="window_start" type="time" min="08:00" max="19:00" step={1800} className="input" /></div>}
      <Submit className="btn-primary justify-self-start" pending="Saving…">{contractor ? "Send offer" : "Assign and confirm"}</Submit>
      {contractor && <p className="text-xs text-text-muted">The booking is confirmed only when the contractor accepts in their portal.</p>}
    </form>
  );
}

export function AdminCancelForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState<FormState, FormData>(cancelBookingByAdminAction.bind(null, bookingId), {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-3">
      <FormMessage state={state} />
      <label htmlFor="reason" className="label">Reason (shown to the customer)</label>
      <input id="reason" name="reason" maxLength={300} className="input" />
      <Submit className="btn bg-status-err text-white justify-self-start hover:opacity-90" pending="Cancelling…">Cancel booking</Submit>
    </form>
  );
}
