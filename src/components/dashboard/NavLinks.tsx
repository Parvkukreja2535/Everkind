"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem { href: string; label: string; icon: React.ReactNode; exact?: boolean; badge?: number }

function isActive(path: string, item: NavItem) {
  return item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
}

export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Dashboard" className="grid gap-0.5">
      {items.map((i) => {
        const active = isActive(path, i);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] transition-colors ${active ? "bg-green-accent/15 text-white shadow-[inset_3px_0_0_#00A82D]" : "text-[#CCCCCC] hover:bg-white/5 hover:text-white"}`}>
            <span className="shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px]">{i.icon}</span>
            <span className="flex-1">{i.label}</span>
            {!!i.badge && <span className="rounded-full bg-green-accent px-2 text-[11px] font-bold text-ink">{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopTabs({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto px-4 pb-2">
      {items.map((i) => {
        const active = isActive(path, i);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${active ? "bg-green-accent text-ink font-semibold" : "text-[#CCCCCC] hover:text-white"}`}>
            <span className="[&>svg]:h-4 [&>svg]:w-4">{i.icon}</span>{i.label}{!!i.badge && <span className="ml-0.5 text-xs">({i.badge})</span>}
          </Link>
        );
      })}
    </nav>
  );
}
