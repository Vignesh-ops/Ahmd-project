import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import PullToRefresh from "@/components/network/PullToRefresh";
import RefreshAfterNavigation from "@/components/navigation/RefreshAfterNavigation";
import RouteWarmup from "@/components/navigation/RouteWarmup";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }) {
  const session = await requireSession();
  const warmRoutes =
    session.user.role === "admin"
      ? ["/bank-order", "/history", "/settings", "/admin"]
      : ["/bank-order", "/history", "/settings"];

  return (
    <div className="app-shell">
      <RouteWarmup routes={warmRoutes} />
      <RefreshAfterNavigation />
      <Navbar user={session.user} />
      <PullToRefresh />
      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-7xl px-4 py-6 pb-28 sm:px-6 md:pb-6">
        {children}
      </main>
      <BottomNav role={session.user.role} />

    </div>
  );
}
