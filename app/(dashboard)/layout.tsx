import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/shared/TopNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomTabBar } from "@/components/shared/BottomTabBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed top navigation bar */}
      <TopNav />

      {/* Content area below the fixed TopNav */}
      <div className="pt-16 flex">
        {/* Desktop sidebar — fixed, visible at lg+ */}
        <aside className="hidden lg:flex flex-col fixed top-16 left-0 bottom-0 w-60 border-r border-border bg-card z-40 overflow-y-auto">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </aside>

        {/* Main content — offset for sidebar on desktop, padded for tab bar on mobile */}
        <main className="flex-1 min-w-0 lg:ml-60 pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar — hidden at lg+ */}
      <div className="lg:hidden">
        <BottomTabBar />
      </div>
    </div>
  );
}
