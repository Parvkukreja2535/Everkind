import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

const COLS = [
  { title: "Services", links: [["Explore all services", "/services"], ["Instant Clean", "/services/cleaning/instant-clean"], ["Short-let cleaning", "/services/cleaning"], ["Handyman", "/services/handyman"]] },
  { title: "Company", links: [["For hosts & property managers", "/for-hosts"], ["How it works", "/how-it-works"], ["About Everkind", "/about"], ["Work with Everkind", "/work-with-everkind"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Terms", "/legal/terms"], ["Privacy", "/legal/privacy"], ["Cookies", "/legal/cookies"], ["Cancellation policy", "/legal/cancellation"]] },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-[#CCCCCC] text-sm">
      <div className="wrap grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-3 max-w-xs">Home and personal services for central London, from everyday cleaning to home maintenance, beauty and beyond.</p>
          <p className="mt-3">Open {SITE.hours}</p>
          <p className="mt-1 select-all">{SITE.email}</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white">{c.title}</h2>
            <ul className="grid gap-2">
              {c.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <p className="border-t border-white/15 pt-5 text-[13px] sm:col-span-2 lg:col-span-4">
          © {new Date().getFullYear()} Everkind. Prices shown are proposed London prices including VAT where applicable. Photos from Unsplash, used under the Unsplash License, for illustration.
        </p>
      </div>
    </footer>
  );
}
