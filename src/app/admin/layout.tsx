import { BadgePoundSterling, CalendarDays, ClipboardList, FolderTree, History, LayoutDashboard, Megaphone, ShoppingBag, UserCheck, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: { default: "Admin", template: "%s | Everkind admin" }, robots: { index: false } };

// Always rendered per request: shows the visitor's own session and live database data, never a cached copy.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side role check on every admin request. Hidden links are not the security: this is.
  const { profile } = await requireAdmin();
  const db = (await supabaseServer())!;
  const { count: pending } = await db.from("professional_applications").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review", "info_required"]);
  const items = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard />, exact: true },
    { href: "/admin/bookings", label: "Bookings", icon: <CalendarDays /> },
    { href: "/admin/services", label: "Services", icon: <ShoppingBag /> },
    { href: "/admin/pricing", label: "Pricing", icon: <BadgePoundSterling /> },
    { href: "/admin/categories", label: "Categories", icon: <FolderTree /> },
    { href: "/admin/professionals", label: "Professionals", icon: <UserCheck />, badge: pending ?? 0 },
    { href: "/admin/customers", label: "Customers", icon: <Users /> },
    { href: "/admin/interest", label: "Interest", icon: <Megaphone /> },
    { href: "/admin/activity", label: "Activity log", icon: <History /> },
    { href: "/account", label: "My account", icon: <ClipboardList /> },
  ];
  return <DashboardShell area="Admin" name={profile.first_name || profile.email} items={items}>{children}</DashboardShell>;
}
