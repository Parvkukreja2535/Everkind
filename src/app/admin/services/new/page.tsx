import Link from "next/link";
import { PageTitle } from "@/components/dashboard/Shell";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { ServiceEditor } from "../ServiceEditor";

export const metadata = { title: "Add service" };

export default async function NewService() {
  await requireAdmin();
  const db = (await supabaseServer())!;
  const { data: cats } = await db.from("categories").select("id, name").order("sort_order");
  return (
    <>
      <p className="mb-3 text-sm"><Link href="/admin/services" className="link font-normal">← Services</Link></p>
      <PageTitle title="Add a service" intro="New services start as 'Coming soon'. Make them 'Available now' when you're ready to take bookings." />
      <ServiceEditor categories={cats ?? []} service={{ name: "", category_id: cats?.[0]?.id ?? "", summary: "", included: [], excluded: [], checks: "", keywords: [], image_url: "", availability: "coming_soon", workforce: "employed", price_type: "fixed", price_pence: null, price_note: "", extra_hour_pence: null, min_hours: null, hours_options: null, duration_minutes: 60, is_active: true, compliance_approved: false }} />
    </>
  );
}
