import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "How it works", description: "How booking with Everkind works for team services, independent professionals and Instant Clean." };

export default function HowItWorks() {
  return (
    <div className="wrap">
      <PageHeader eyebrow="How it works" title="Simple to book. Clear at every step." />
      <Prose>
        <h2>Everkind team services</h2>
        <p>Cleaning, hair, nails and barbering are carried out by people Everkind employs and trains. Choose a time, send your booking, and we'll email you to confirm your team member and arrival window.</p>
        <h2>Independent professionals</h2>
        <p>Handyman jobs are carried out by vetted, self-employed professionals. You send a request, we tell you straight away that it's been received, and your booking is confirmed as soon as a professional accepts. If nobody can take the job, we'll tell you and suggest other times.</p>
        <h2>Instant Clean</h2>
        <p>Book an equipped Everkind cleaner by the hour for everyday chores. Choose your tasks in order of priority. We assign an on-duty cleaner and send you an estimated arrival time.</p>
        <h2>Payment</h2>
        <p>{SITE.noPayment}</p>
        <h2>Arrival times</h2>
        <p>Arrival times are estimates based on the schedule and typical travel time between postcodes. They may change, and we'll update you if they do. We don't track anyone's location.</p>
        <h2>Hours and area</h2>
        <p>We work {SITE.hours}, within 6 miles of the City of London. Every booking must finish by 8:00pm.</p>
        <p><Link href="/services" className="link">Explore all services →</Link></p>
      </Prose>
    </div>
  );
}
