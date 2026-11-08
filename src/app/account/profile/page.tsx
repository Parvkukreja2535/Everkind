import type { Metadata } from "next";
import { Empty, PageTitle, Panel } from "@/components/dashboard/Shell";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { deleteAddressAction } from "../actions";
import { AddressForm, DetailsForm, PasswordForm } from "./ProfileForms";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const { profile, user } = await requireUser("/account/profile");
  const supabase = (await supabaseServer())!;
  const { data: addresses } = await supabase.from("customer_addresses").select("*").order("created_at");
  return (
    <>
      <PageTitle title="My profile" intro={<>Signed in as <b className="text-text">{user.email}</b>. To change your email address, please contact us.</>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Personal information"><DetailsForm first={profile.first_name} last={profile.last_name} phone={profile.phone} /></Panel>
        <Panel title="Password"><PasswordForm /></Panel>
        <Panel title="Saved addresses" className="xl:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              {addresses?.length ? (
                <ul className="grid gap-3">
                  {addresses.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 rounded-ctl border border-line p-3 text-sm">
                      <span><b>{a.label}</b>{a.is_default ? " · Default" : ""}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.postcode}</span>
                      <form action={deleteAddressAction}><input type="hidden" name="id" value={a.id} /><button className="text-status-err hover:underline">Remove</button></form>
                    </li>
                  ))}
                </ul>
              ) : <Empty>No saved addresses yet.</Empty>}
            </div>
            <AddressForm />
          </div>
        </Panel>
      </div>
    </>
  );
}
