"use client";

import { useActionState, useState } from "react";
import { FormMessage, Submit, type FormState } from "@/components/forms";
import { decideApplicationAction, setProfessionalServicesAction } from "../actions";

type Svc = { slug: string; name: string; workforce: string };

function ServicePicker({ services, selected, workerType }: { services: Svc[]; selected: string[]; workerType: string }) {
  const fits = (s: Svc) => (workerType === "employed" ? s.workforce === "employed" : s.workforce !== "employed");
  return (
    <div className="grid max-h-72 gap-1 overflow-y-auto rounded-ctl border border-line p-3 text-sm sm:grid-cols-2">
      {services.map((s) => (
        <label key={s.slug} className={`flex gap-2 ${fits(s) ? "" : "opacity-40"}`}>
          <input type="checkbox" name="services" value={s.slug} defaultChecked={selected.includes(s.slug) && fits(s)} disabled={!fits(s)} className="mt-0.5 accent-green" />
          <span>{s.name}{s.workforce === "regulated" ? " (regulated)" : ""}</span>
        </label>
      ))}
    </div>
  );
}

export function DecisionForm({ applicationId, applied, services, status }: { applicationId: string; applied: string[]; services: Svc[]; status: string }) {
  const [state, action] = useActionState<FormState, FormData>(decideApplicationAction.bind(null, applicationId), {});
  const [decision, setDecision] = useState(status === "submitted" ? "under_review" : "approved");
  const [workerType, setWorkerType] = useState("employed");
  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <fieldset className="grid gap-2 text-sm">
        <legend className="label">Decision</legend>
        {[["under_review", "Mark as under review"], ["info_required", "Request additional information"], ["approved", "Approve"], ["rejected", "Reject"]].map(([v, l]) => (
          <label key={v} className="flex gap-2"><input type="radio" name="decision" value={v} checked={decision === v} onChange={() => setDecision(v)} className="accent-green" />{l}</label>
        ))}
      </fieldset>
      {decision === "approved" && (
        <>
          <fieldset className="grid gap-2 text-sm">
            <legend className="label">Working arrangement</legend>
            <label className="flex gap-2"><input type="radio" name="worker_type" value="employed" checked={workerType === "employed"} onChange={() => setWorkerType("employed")} className="accent-green" />Everkind employee (cleaning, hair, nails, barbering; Everkind assigns jobs)</label>
            <label className="flex gap-2"><input type="radio" name="worker_type" value="contractor" checked={workerType === "contractor"} onChange={() => setWorkerType("contractor")} className="accent-green" />Independent contractor (handyman and specialist work; accepts job requests)</label>
          </fieldset>
          <div><p className="label">Approved services</p><ServicePicker services={services} selected={applied} workerType={workerType} /></div>
          <p className="text-xs text-text-muted">Before approving, check identity, right to work, references, insurance and any required qualifications or registrations. Employment contracts and contractor terms are agreed outside this system.</p>
        </>
      )}
      <div>
        <label htmlFor="note" className="label">{decision === "info_required" ? "What do you need from the applicant? (they'll see this)" : decision === "rejected" ? "Message to the applicant (optional)" : "Internal note (optional)"}</label>
        <textarea id="note" name="note" rows={3} maxLength={2000} className="input h-auto py-2" />
      </div>
      <Submit className="btn-primary justify-self-start" pending="Saving…">Save decision</Submit>
    </form>
  );
}

export function ProServicesForm({ proId, services, selected, workerType }: { proId: string; services: Svc[]; selected: string[]; workerType: string }) {
  const [state, action] = useActionState<FormState, FormData>(setProfessionalServicesAction.bind(null, proId), {});
  return (
    <form action={action} className="grid gap-3">
      <FormMessage state={state} />
      <ServicePicker services={services} selected={selected} workerType={workerType} />
      <Submit className="btn-secondary btn-sm justify-self-start" pending="Saving…">Save approved services</Submit>
    </form>
  );
}
