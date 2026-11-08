import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "About Everkind" };

export default function About() {
  return (
    <div className="wrap">
      <PageHeader eyebrow="About" title="Everything your home needs. One place." intro="Everkind is a new London home and personal services company, starting in central London." />
      <Prose>
        <p>We combine our own employed team for cleaning, hair, nails and barbering with vetted independent professionals for specialist jobs. We start with a small, focused set of services and add more only when we can deliver them well and, for regulated work, when the right registrations and approvals are in place.</p>
        <p>We're just getting started, so you won't see customer numbers or reviews here yet. We'll only ever show real ones.</p>
      </Prose>
    </div>
  );
}
