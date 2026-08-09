"use client";

import { useShellStore } from "@/lib/state/shell-store";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SessionGuard } from "@/components/auth/session-guard";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import { SkipLink } from "@/components/shell/skip-link";
import { cn } from "@/lib/utils/cn";

/**
 * Authenticated application shell (FE-SH): sidebar + topbar + content region.
 * Wraps every `(app)` route. Auth state is hydrated on the client from the
 * BFF `/api/auth/me` endpoint (auth-guard §3).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SessionGuard>
        <ShellFrame>{children}</ShellFrame>
      </SessionGuard>
    </AuthProvider>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const collapsed = useShellStore((s) => s.sidebarCollapsed);
  return (
    <ThemeProvider>
      <div className="min-h-dvh bg-background text-primary">
        <SkipLink />
        <Sidebar />
        <MobileNav />
        <div className={cn("flex min-h-dvh flex-col md:pl-60", collapsed && "md:pl-14")}>
          <Topbar />
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Breadcrumbs />
          </div>
          <main id="main" className="flex-1 px-4 pb-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}