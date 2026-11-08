import { CalendarDays, Home, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { requireUser } from "@/lib/auth";

// Always rendered per request: shows the visitor's own session and live database data, never a cached copy.
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser("/account");
  const items = [
    { href: "/account", label: "Overview", icon: <Home />, exact: true },
    { href: "/account/bookings", label: "My bookings", icon: <CalendarDays /> },
    { href: "/account/profile", label: "My profile", icon: <UserRound /> },
  ];
  if (profile.role === "professional") items.push({ href: "/pro", label: "Professional portal", icon: <UserRound /> });
  if (profile.role === "admin") items.push({ href: "/admin", label: "Admin dashboard", icon: <UserRound /> });
  return <DashboardShell area="My account" name={profile.first_name || profile.email} items={items}>{children}</DashboardShell>;
}
