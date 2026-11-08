"use client";

import { useActionState } from "react";
import { Field, FormMessage, Submit, type FormState } from "@/components/forms";
import { addAddressAction, changePasswordAction, updateProfileAction } from "../actions";

export function DetailsForm({ first, last, phone }: { first: string; last: string; phone: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="first_name" defaultValue={first} autoComplete="given-name" error={state.errors?.first_name} />
        <Field label="Last name" name="last_name" defaultValue={last} autoComplete="family-name" error={state.errors?.last_name} />
      </div>
      <Field label="Phone number" name="phone" type="tel" defaultValue={phone} autoComplete="tel" error={state.errors?.phone} />
      <Submit className="btn-primary justify-self-start" pending="Saving…">Save details</Submit>
    </form>
  );
}

export function AddressForm() {
  const [state, action] = useActionState<FormState, FormData>(addAddressAction, {});
  return (
    <form action={action} className="grid gap-3" noValidate key={state.ts ?? 0}>
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Label" name="label" defaultValue="Home" maxLength={40} error={state.errors?.label} />
        <Field label="Postcode" name="postcode" autoComplete="postal-code" error={state.errors?.postcode} />
      </div>
      <Field label="Address line 1" name="line1" autoComplete="address-line1" error={state.errors?.line1} />
      <Field label="Address line 2 (optional)" name="line2" autoComplete="address-line2" error={state.errors?.line2} />
      <Field label="Town or city" name="city" defaultValue="London" autoComplete="address-level2" error={state.errors?.city} />
      <Submit className="btn-secondary justify-self-start" pending="Saving…">Add address</Submit>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormMessage state={state} />
      <Field label="Current password" name="current" type="password" autoComplete="current-password" error={state.errors?.current} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters, including a letter and a number." error={state.errors?.password} />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" error={state.errors?.confirm} />
      <Submit className="btn-secondary justify-self-start" pending="Saving…">Change password</Submit>
    </form>
  );
}
