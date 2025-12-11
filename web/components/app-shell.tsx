"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const tDashboard = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/register");

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push(`/${locale}/login`);
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/dashboard`}
              className="text-lg font-semibold tracking-tight"
            >
              BriefAI
            </Link>
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                <Link href={`/${locale}/dashboard`} className="hover:text-foreground">
                  {tDashboard("title")}
                </Link>
                {user?.role === "SUPER_ADMIN" && (
                  <Link
                    href={`/${locale}/admin/app-config`}
                    className="hover:text-foreground"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated && (
              <>
                <span className="hidden sm:inline text-sm text-muted-foreground max-w-[160px] truncate">
                  {user?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  {tAuth("logout")}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
