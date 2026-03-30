import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }) {
  const session = await requireSession();

  return (
    <div className="app-shell">
      <Navbar user={session.user} />
      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-7xl px-4 py-6 pb-28 sm:px-6 md:pb-6">
        {children}
      </main>
      <BottomNav role={session.user.role} />
    </div>
  );
}
