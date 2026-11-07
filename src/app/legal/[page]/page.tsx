import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

const PAGES: Record<string, { title: string; body: React.ReactNode }> = {
  terms: {
    title: "Terms of service",
    body: (
      <>
        <p>These terms explain how booking with Everkind works. By sending a booking you agree to them.</p>
        <ul>
          <li>Prices and what's included are shown on each service page before you book.</li>
          <li>{SITE.noPayment}</li>
          <li>Bookings with our employed team are confirmed by email with your team member and arrival window. Bookings with independent professionals are confirmed once a professional accepts.</li>
          <li>Extra time or work is only carried out with your approval.</li>
          <li>Arrival times are estimates and may change.</li>
          <li>Services are available {SITE.hours} within our service area.</li>
        </ul>
      </>
    ),
  },
  privacy: {
    title: "Privacy notice",
    body: (
      <>
        <p>We collect the details you give us when you book or register interest: your name, email, phone number, address and postcode, and any notes you add.</p>
        <ul>
          <li><b>Why:</b> to arrange and manage your booking, to contact you about it, and, if you ask us to, to tell you when a service becomes available.</li>
          <li><b>Who sees it:</b> Everkind staff who manage bookings, and the professional assigned to your job. We use service providers to host the website and database and to send email.</li>
          <li><b>How long:</b> booking records are kept for as long as needed for the booking and our legal obligations. Interest sign-ups are deleted after 24 months.</li>
          <li><b>Your rights:</b> you can ask to see, correct or delete your data, or unsubscribe, by emailing {SITE.email}.</li>
        </ul>
      </>
    ),
  },
  cookies: {
    title: "Cookie policy",
    body: <p>This website currently uses only the cookies and storage needed for it to work. We don't use advertising or analytics cookies. If that changes, we'll ask for your consent first.</p>,
  },
  cancellation: {
    title: "Cancellation policy",
    body: (
      <>
        <p>{SITE.cancellation}</p>
        <ul>
          <li>To cancel or change a booking, email {SITE.email} with your booking reference.</li>
          <li>Cancellations within 24 hours of the booking may incur a fee in future. While no payment is taken online, no fee is charged.</li>
          <li>If something isn't right after a clean, tell us within 24 hours, with photos, and we'll arrange a re-clean where appropriate.</li>
        </ul>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const p = PAGES[(await params).page];
  return p ? { title: p.title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ page: string }> }) {
  const p = PAGES[(await params).page];
  if (!p) notFound();
  return (
    <div className="wrap">
      <PageHeader eyebrow="Legal" title={p.title} />
      <Prose>
        <p className="rounded-ctl border border-amber-line bg-amber-tint p-3 text-sm">Draft: this page is a placeholder and must be reviewed by a solicitor before Everkind launches publicly.</p>
        {p.body}
      </Prose>
    </div>
  );
}
