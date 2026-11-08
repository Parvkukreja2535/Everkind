"use client";

import { useFormStatus } from "react-dom";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Changes on every successful submit; used as a React key to clear the form. */
  ts?: number;
}

export function Field({ label, name, error, hint, className = "", ...props }: { label: string; name: string; error?: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={name} className={`input ${error ? "border-status-err" : ""}`} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...props} />
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-status-err">{error}</p>}
    </div>
  );
}

export function TextArea({ label, name, error, hint, ...props }: { label: string; name: string; error?: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <textarea id={id} name={name} className={`input h-auto py-2 ${error ? "border-status-err" : ""}`} aria-invalid={!!error} rows={4} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
      {error && <p className="mt-1 text-sm text-status-err">{error}</p>}
    </div>
  );
}

export function Submit({ children, pending, className = "btn-primary w-full" }: { children: React.ReactNode; pending?: string; className?: string }) {
  const { pending: busy } = useFormStatus();
  return <button type="submit" className={className} disabled={busy}>{busy ? pending ?? "Please wait…" : children}</button>;
}

export function FormMessage({ state }: { state?: FormState }) {
  if (!state?.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`rounded-ctl p-3 text-sm ${state.ok ? "bg-green-tint text-status-ok" : "bg-[#F8E6E3] text-status-err"}`}>
      {state.message}
    </p>
  );
}
