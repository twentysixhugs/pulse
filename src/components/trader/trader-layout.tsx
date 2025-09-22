
'use client';
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export function TraderLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm font-medium text-muted-foreground">/</span>
            <h1 className="text-lg font-headline font-semibold">Панель трейдера</h1>
          </div>
           <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.name}
            </span>
            <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto py-8">{children}</div>
      </main>
    </div>
  );
}
