import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSession, homeFor } from "@/lib/auth";

// Always rendered per request: shows the visitor's own session and live database data, never a cached copy.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const account = session ? { firstName: session.profile.first_name || "Account", href: homeFor(session.profile.role) } : null;
  return (
    <>
      <SiteHeader account={account} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
