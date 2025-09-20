import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function TraderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <Logo />
            <span className="text-sm font-medium text-muted-foreground">/</span>
            <h1 className="text-lg font-headline font-semibold">Панель трейдера</h1>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto py-8">{children}</div>
      </main>
    </div>
  );
}
