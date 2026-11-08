"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Submit, type FormState } from "@/components/forms";
import { loginAction } from "../actions";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, notice ? { message: notice } : {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={state.errors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required error={state.errors?.password} />
      <p className="-mt-1 text-right text-sm"><Link href="/forgot-password" className="link font-normal">Forgotten your password?</Link></p>
      <Submit pending="Logging in…">Log in</Submit>
    </form>
  );
}
