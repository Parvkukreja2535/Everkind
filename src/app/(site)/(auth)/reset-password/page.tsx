"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Submit, type FormState } from "@/components/forms";
import { resetPasswordAction } from "../actions";

export default function ResetPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <>
      <p className="eyebrow">Choose a new password</p>
      <h1 className="display mt-3 text-4xl">Set a new password</h1>
      <form action={action} className="mt-8 grid gap-4" noValidate>
        <FormMessage state={state} />
        {state.ok ? (
          <Link href="/account" className="btn-primary">Go to my account</Link>
        ) : (
          <>
            <Field label="New password" name="password" type="password" autoComplete="new-password" required hint="At least 8 characters, including a letter and a number." error={state.errors?.password} />
            <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={state.errors?.confirm} />
            <Submit pending="Saving…">Save new password</Submit>
          </>
        )}
      </form>
    </>
  );
}
