"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/services", label: "Explore all services" },
  { href: "/services/cleaning/instant-clean", label: "Instant Clean" },
  { href: "/for-hosts", label: "For hosts" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader({ account }: { account: { firstName: string; href: string } | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${scrolled ? "border-line shadow-[0_6px_24px_-18px_rgba(0,0,0,0.35)]" : "border-transparent"}`}>
      <div className="wrap flex items-center justify-between gap-4 py-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link transition-colors hover:text-green">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {account ? (
            <Link href={account.href} className="nav-link hidden text-[15px] hover:text-green sm:inline">My account</Link>
          ) : (
            <Link href="/login" className="nav-link hidden text-[15px] hover:text-green sm:inline">Log in</Link>
          )}
          <Link href="/services" className="btn-primary btn-sm">Book</Link>
          <button type="button" className="inline-grid h-10 w-11 place-items-center rounded-ctl border border-line lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
          <ul className="wrap grid gap-1 py-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-ctl px-2 py-3 text-lg hover:bg-surface">{n.label}</Link>
              </li>
            ))}
            <li><Link href={account ? account.href : "/login"} onClick={() => setOpen(false)} className="block rounded-ctl px-2 py-3 text-lg hover:bg-surface">{account ? "My account" : "Log in or create an account"}</Link></li>
            <li><Link href="/work-with-everkind" onClick={() => setOpen(false)} className="block rounded-ctl px-2 py-3 text-lg hover:bg-surface">Work with Everkind</Link></li>
            <li><Link href="/contact" onClick={() => setOpen(false)} className="block rounded-ctl px-2 py-3 text-lg hover:bg-surface">Contact</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
