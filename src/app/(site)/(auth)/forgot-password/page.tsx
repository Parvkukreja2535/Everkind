"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Submit, type FormState } from "@/components/forms";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <>
      <p className="eyebrow">Reset your password</p>
      <h1 className="display mt-3 text-4xl">Forgotten your password?</h1>
      <p className="mt-2 text-text-muted">Enter your email and we'll send you a link to choose a new one.</p>
      <form action={action} className="mt-8 grid gap-4" noValidate>
        <FormMessage state={state} />
        {!state.ok && <Field label="Email" name="email" type="email" autoComplete="email" required error={state.errors?.email} />}
        {!state.ok && <Submit pending="Sending…">Send reset link</Submit>}
      </form>
      <p className="mt-6 text-sm"><Link href="/login" className="link">Back to log in</Link></p>
    </>
  );
}
