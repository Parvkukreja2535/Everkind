"use client";

import { useActionState, useState } from "react";
import { FormMessage, Submit, type FormState } from "@/components/forms";
import { cancelBookingAction } from "../../actions";

export function CancelForm({ bookingId, within24h }: { bookingId: string; within24h: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(cancelBookingAction.bind(null, bookingId), {});
  if (state.ok) return <FormMessage state={state} />;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn border border-line text-status-err hover:border-status-err">Cancel booking</button>;
  return (
    <form action={action} className="grid gap-3">
      <FormMessage state={state} />
      {within24h && <p className="text-sm text-status-warn">This booking is less than 24 hours away. While payments are off, no fee is charged.</p>}
      <label className="label" htmlFor="reason">Reason (optional)</label>
      <input id="reason" name="reason" className="input" maxLength={300} />
      <div className="flex gap-2">
        <Submit className="btn bg-status-err text-white hover:opacity-90" pending="Cancelling…">Confirm cancellation</Submit>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Keep booking</button>
      </div>
    </form>
  );
}
