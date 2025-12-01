
'use client';
import { Logo } from "@/components/common/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Авторизация…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="space-y-4">
          <p className="text-lg font-semibold">Нет доступа</p>
          <p className="text-sm text-muted-foreground">
            {error?.message ?? 'Не удалось подтвердить учетную запись Telegram.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.name ?? (user?.telegram?.username ? `@${user.telegram.username}` : '—')}
              </span>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
