import { Briefcase, CalendarClock, Home, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { getProfessional } from "@/lib/auth";

// Always rendered per request: shows the visitor's own session and live database data, never a cached copy.
export const dynamic = "force-dynamic";

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const { session, pro } = await getProfessional();
  const items = pro
    ? [
        { href: "/pro", label: "Overview", icon: <Home />, exact: true },
        { href: "/pro/jobs", label: pro.worker_type === "contractor" ? "Jobs & requests" : "My schedule", icon: <Briefcase /> },
        { href: "/pro/availability", label: "Availability", icon: <CalendarClock /> },
        { href: "/pro/profile", label: "Profile & documents", icon: <UserRound /> },
      ]
    : [{ href: "/pro", label: "My application", icon: <Home />, exact: true }, { href: "/account", label: "My account", icon: <UserRound /> }];
  return <DashboardShell area={pro ? (pro.worker_type === "contractor" ? "Independent contractor" : "Everkind team member") : "Professional application"} name={session.profile.first_name || session.profile.email} items={items}>{children}</DashboardShell>;
}
