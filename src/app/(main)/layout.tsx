import { Logo } from "@/components/common/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Cog, GanttChartSquare } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/trader" aria-label="Trader Dashboard">
                    <GanttChartSquare className="h-5 w-5"/>
                </Link>
            </Button>
             <Button variant="ghost" size="icon" asChild>
                <Link href="/admin" aria-label="Admin Panel">
                    <Cog className="h-5 w-5"/>
                </Link>
            </Button>
            <Button variant="ghost" size="icon">
                <User className="h-5 w-5"/>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
