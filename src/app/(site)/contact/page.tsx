import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  return (
    <div className="wrap">
      <PageHeader eyebrow="Contact" title="Get in touch" />
      <Prose>
        <p>Email us at <span className="select-all font-semibold">{SITE.email}</span></p>
        <p>We're available {SITE.hours}.</p>
        <p>For an existing booking, include your booking reference (it starts with EK-).</p>
      </Prose>
    </div>
  );
}
