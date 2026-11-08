"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Submit, TextArea, type FormState } from "@/components/forms";
import { submitApplicationAction } from "./actions";

export interface ServiceChoice { slug: string; name: string; category: string; note?: string }

export function ApplicationForm({ loggedIn, defaults, groups }: { loggedIn: boolean; defaults: { first: string; last: string; phone: string; email: string }; groups: { category: string; services: ServiceChoice[] }[] }) {
  const [state, action] = useActionState<FormState, FormData>(submitApplicationAction, {});
  if (state.ok) {
    return (
      <div className="grid gap-4">
        <FormMessage state={state} />
        <p className="text-sm text-text-muted">Application status: <b className="text-text">Submitted</b>. Every application is reviewed by the Everkind team before any professional access is given.</p>
        <Link href="/pro" className="btn-primary justify-self-start">Go to the professional portal</Link>
      </div>
    );
  }
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <fieldset className="grid gap-4">
        <legend className="mb-1 text-lg font-semibold">About you</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="first_name" defaultValue={defaults.first} autoComplete="given-name" error={e.first_name} />
          <Field label="Last name" name="last_name" defaultValue={defaults.last} autoComplete="family-name" error={e.last_name} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone number" name="phone" type="tel" defaultValue={defaults.phone} autoComplete="tel" error={e.phone} />
          <Field label="Home postcode" name="home_postcode" autoComplete="postal-code" error={e.home_postcode} />
        </div>
        {loggedIn ? (
          <p className="text-sm text-text-muted">Applying as <b className="text-text">{defaults.email}</b>.</p>
        ) : (
          <>
            <Field label="Email" name="email" type="email" autoComplete="email" error={e.email} hint="You'll use this to log in and track your application." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Create a password" name="password" type="password" autoComplete="new-password" error={e.password} hint="At least 8 characters, with a letter and a number." />
              <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" error={e.confirm} />
            </div>
            <p className="-mt-2 text-sm text-text-muted">Already have an account? <Link href="/login?next=/work-with-everkind" className="link font-normal">Log in first</Link>.</p>
          </>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-semibold">Services you'd like to provide</legend>
        {e.services && <p className="mb-2 text-sm text-status-err">{e.services}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.category} className="rounded-ctl border border-line p-3">
              <p className="mb-2 text-sm font-semibold">{g.category}</p>
              <div className="grid gap-1.5">
                {g.services.map((s) => (
                  <label key={s.slug} className="flex gap-2 text-sm">
                    <input type="checkbox" name="services" value={s.slug} className="mt-0.5 accent-green" />
                    <span>{s.name}{s.note && <span className="text-text-muted"> · {s.note}</span>}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-lg font-semibold">Experience</legend>
        <TextArea label="Relevant qualifications" name="qualifications" maxLength={2000} hint="For example NVQ in hairdressing, City & Guilds, first aid. Leave blank if none." error={e.qualifications} />
        <TextArea label="Previous experience" name="experience" maxLength={2000} error={e.experience} />
        <div>
          <label htmlFor="f-employment_preference" className="label">How would you like to work?</label>
          <select id="f-employment_preference" name="employment_preference" className="input" defaultValue="not_sure">
            <option value="employed">As an Everkind employee (cleaning, hair, nails, barbering)</option>
            <option value="self_employed">As an independent, self-employed professional</option>
            <option value="either">Either</option>
            <option value="not_sure">Not sure yet</option>
          </select>
          <p className="mt-1 text-xs text-text-muted">Cleaning, beauty and barbering are usually done by Everkind employees. Handyman and specialist work is done by independent contractors. Final terms are agreed with you on approval.</p>
        </div>
        <TextArea label="Availability" name="availability" rows={2} maxLength={1000} placeholder="e.g. weekdays 9am–5pm, some Saturdays" error={e.availability} />
        <TextArea label="Short introduction" name="introduction" maxLength={1500} error={e.introduction} />
        <div>
          <label htmlFor="f-cv" className="label">CV <span className="font-normal text-text-muted">(optional, PDF or Word, up to 4 MB)</span></label>
          <input id="f-cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full text-sm file:mr-3 file:rounded-ctl file:border-0 file:bg-green-tint file:px-4 file:py-2 file:font-semibold file:text-green" />
          {e.cv && <p className="mt-1 text-sm text-status-err">{e.cv}</p>}
        </div>
      </fieldset>

      <div>
        <label className="flex gap-3 text-sm text-text-muted">
          <input type="checkbox" name="consent" className="mt-1 accent-green" />
          <span>I confirm the information is accurate, and I agree to Everkind using it (and my CV) to assess my application, as described in the <Link href="/legal/privacy" className="link font-normal">privacy notice</Link>. Submitting an application doesn't guarantee work or create employment.</span>
        </label>
        {e.consent && <p className="mt-1 text-sm text-status-err">{e.consent}</p>}
      </div>
      <Submit className="btn-primary btn-lg justify-self-start" pending="Submitting…">Submit application</Submit>
    </form>
  );
}
