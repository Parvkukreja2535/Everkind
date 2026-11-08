import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCatalogue } from "@/lib/catalogue-data";
import { supabaseServer } from "@/lib/supabase/server";
import { ApplicationForm } from "./ApplicationForm";

export const metadata: Metadata = { title: "Work with Everkind", description: "Apply to work with Everkind as a cleaner, hairdresser, barber, beauty professional, handyman or specialist." };

export default async function WorkWithEverkind() {
  const [session, { categories, services }] = await Promise.all([getSession(), getCatalogue()]);
  let existing: { status: string } | null = null;
  if (session) {
    const supabase = (await supabaseServer())!;
    const { data } = await supabase.from("professional_applications").select("status").eq("user_id", session.user.id).maybeSingle();
    existing = data;
  }
  const groups = categories
    .map((c) => ({ category: c.name, services: services.filter((s) => s.category === c.slug).map((s) => ({ slug: s.slug, name: s.name, category: c.name, note: s.workforce === "regulated" ? "registration required" : s.availability !== "available_now" ? "future service" : undefined })) }))
    .filter((g) => g.services.length);

  return (
    <div className="wrap pb-24">
      <div className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="eyebrow">Work with Everkind</p>
          <h1 className="display mt-3 text-[clamp(36px,4.6vw,54px)] leading-tight">Bring your skills to London homes</h1>
          <p className="mt-4 max-w-[600px] text-lg text-text-muted">We're looking for cleaners, hairdressers, barbers, beauty professionals, handymen and specialists who take pride in their work.</p>
          <ul className="mt-6 grid gap-2 text-[15px]">
            <li><b>Employed roles</b> for cleaning, hair, nails and barbering: Everkind schedules your work.</li>
            <li><b>Independent contractor work</b> for handyman and specialist jobs: you choose which job requests to accept.</li>
            <li><b>Every application is reviewed</b> by our team. We check identity, right to work, references, insurance and qualifications before approving anyone.</li>
          </ul>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]"><Image src="/images/brand/everkind-team-member.jpg" alt="Illustration: a team member in an Everkind T-shirt" fill sizes="(min-width:1024px) 480px, 100vw" className="object-cover" /></div>
      </div>
      <div className="card max-w-[860px] p-6 sm:p-8">
        {existing ? (
          <div className="grid gap-3">
            <h2 className="text-xl font-semibold">You've already applied</h2>
            <p className="text-text-muted">You can see your application's status and any requests from our team in the professional portal.</p>
            <Link href="/pro" className="btn-primary justify-self-start">View my application</Link>
          </div>
        ) : session && session.profile.role !== "customer" ? (
          <p>This account already has {session.profile.role} access. <Link href="/pro" className="link">Open the professional portal</Link></p>
        ) : (
          <>
            <h2 className="mb-5 text-2xl font-semibold">Apply now</h2>
            <ApplicationForm loggedIn={!!session} defaults={{ first: session?.profile.first_name ?? "", last: session?.profile.last_name ?? "", phone: session?.profile.phone ?? "", email: session?.user.email ?? "" }} groups={groups} />
          </>
        )}
      </div>
    </div>
  );
}
