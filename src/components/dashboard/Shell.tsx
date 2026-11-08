import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SideNav, TopTabs, type NavItem } from "./NavLinks";

export function DashboardShell({ area, name, items, children }: { area: string; name: string; items: NavItem[]; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden flex-col bg-ink px-3 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-3 pb-2"><Logo dark /></div>
        <p className="px-3 pb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-green-accent">{area}</p>
        <SideNav items={items} />
        <div className="mt-auto grid gap-1 border-t border-white/10 pt-4 text-sm">
          <p className="truncate px-3 pb-1 text-[#CCCCCC]">Signed in as <b className="text-white">{name}</b></p>
          <Link href="/" className="rounded-lg px-3 py-2 text-[#CCCCCC] hover:bg-white/5 hover:text-white">Back to website</Link>
          <form action="/auth/logout" method="post">
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#CCCCCC] hover:bg-white/5 hover:text-white"><LogOut size={16} aria-hidden="true" />Log out</button>
          </form>
        </div>
      </aside>
      <header className="sticky top-0 z-30 bg-ink lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo dark />
          <form action="/auth/logout" method="post"><button className="text-sm text-[#CCCCCC]">Log out</button></form>
        </div>
        <TopTabs items={items} />
      </header>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}

export function PageTitle({ title, intro, action }: { title: string; intro?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-text sm:text-[28px]">{title}</h1>
        {intro && <p className="mt-1 max-w-[720px] text-[15px] text-text-muted">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] text-text-muted">{label}</p>
      <p className="mt-1 text-[26px] font-semibold tabular-nums">{value}</p>
      {note && <p className="text-xs text-text-muted">{note}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-card border border-dashed border-line p-8 text-center text-sm text-text-muted">{children}</p>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok" | "err"; children: React.ReactNode }) {
  const cls = { info: "bg-[#E3ECF1] text-[#24485C]", warn: "bg-amber-tint text-[#6E480E] border border-amber-line", ok: "bg-green-tint text-status-ok", err: "bg-[#F8E6E3] text-status-err" }[tone];
  return <div className={`rounded-ctl p-3 text-sm ${cls}`}>{children}</div>;
}
