import { cookies } from "next/headers";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { homeForRole } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { navForRole } from "@/lib/nav";
import { usingMockData } from "@/server/data-source";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  const nav = navForRole(user.role);

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar nav={nav} homeHref={homeForRole(user.role)} />
      <SidebarInset>
        <AppHeader
          nav={nav}
          user={{ name: user.name, email: user.email, role: user.role }}
          demoData={usingMockData}
        />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
