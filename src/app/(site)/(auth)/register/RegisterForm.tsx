"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Submit, type FormState } from "@/components/forms";
import { registerAction } from "../actions";

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="first_name" autoComplete="given-name" required error={state.errors?.first_name} />
        <Field label="Last name" name="last_name" autoComplete="family-name" required error={state.errors?.last_name} />
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" required error={state.errors?.email} />
      <Field label="Phone number" name="phone" type="tel" autoComplete="tel" required error={state.errors?.phone} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required hint="At least 8 characters, including a letter and a number." error={state.errors?.password} />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required error={state.errors?.confirm} />
      <div>
        <label className="flex gap-3 text-sm text-text-muted">
          <input type="checkbox" name="terms" className="mt-1 accent-green" />
          <span>I agree to the <Link href="/legal/terms" className="link font-normal">terms</Link> and have read the <Link href="/legal/privacy" className="link font-normal">privacy notice</Link>.</span>
        </label>
        {state.errors?.terms && <p className="mt-1 text-sm text-status-err">{state.errors.terms}</p>}
      </div>
      <Submit pending="Creating your account…">Create account</Submit>
    </form>
  );
}
