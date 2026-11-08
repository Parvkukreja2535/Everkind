import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, PageTitle, Panel } from "@/components/dashboard/Shell";
import { getProfessional } from "@/lib/auth";
import { dateLong } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { deleteAvailabilityAction, deleteTimeOffAction } from "../actions";
import { AvailabilityForm, DAYS, TimeOffForm } from "../ProForms";

export const metadata: Metadata = { title: "Availability" };

export default async function ProAvailability() {
  const { pro } = await getProfessional();
  if (!pro) redirect("/pro");
  const db = (await supabaseServer())!;
  const [{ data: slots }, { data: off }] = await Promise.all([
    db.from("professional_availability").select("*").eq("professional_id", pro.id).order("weekday").order("start_time"),
    db.from("professional_time_off").select("*").eq("professional_id", pro.id).gte("ends_on", new Date().toISOString().slice(0, 10)).order("starts_on"),
  ]);
  return (
    <>
      <PageTitle title="Availability" intro="Set the hours you can usually work. Everkind operates 8:00am–8:00pm." />
      <div className="grid gap-6">
        <Panel title="Weekly hours">
          {slots?.length ? (
            <ul className="mb-5 grid gap-2 sm:grid-cols-2">
              {slots.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-ctl border border-line px-3 py-2 text-sm">
                  <span><b>{DAYS[s.weekday]}</b> · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
                  <form action={deleteAvailabilityAction}><input type="hidden" name="id" value={s.id} /><button className="text-status-err hover:underline">Remove</button></form>
                </li>
              ))}
            </ul>
          ) : <div className="mb-5"><Empty>You haven't added any hours yet.</Empty></div>}
          <AvailabilityForm />
        </Panel>
        <Panel title="Time off">
          {off?.length ? (
            <ul className="mb-5 grid gap-2">
              {off.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-ctl border border-line px-3 py-2 text-sm">
                  <span>{dateLong(t.starts_on)} – {dateLong(t.ends_on)}{t.note ? ` · ${t.note}` : ""}</span>
                  <form action={deleteTimeOffAction}><input type="hidden" name="id" value={t.id} /><button className="text-status-err hover:underline">Remove</button></form>
                </li>
              ))}
            </ul>
          ) : <div className="mb-5"><Empty>No time off booked.</Empty></div>}
          <TimeOffForm />
        </Panel>
      </div>
    </>
  );
}
