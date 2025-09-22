
'use client';
import { useState, useEffect } from 'react';
import { Logo } from "@/components/common/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, LogOut, Database, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { seedDatabase, isDbSeeded } from '@/lib/seed-db';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [showSeedButton, setShowSeedButton] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function checkDb() {
      // This now runs only on the client-side after mount
      const seeded = await isDbSeeded();
      setShowSeedButton(!seeded);
    }
    if (typeof window !== 'undefined') {
      checkDb();
    }
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase(db);
      toast({
        title: "Database Seeded",
        description: "The database has been populated with initial data.",
      });
      setShowSeedButton(false);
      // force reload to show new data
      window.location.reload(); 
    } catch (error) {
      console.error("Failed to seed database:", error);
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: "There was an error populating the database.",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            {showSeedButton && (
              <div className="flex items-center gap-2 border-r pr-2 mr-2">
                 <AlertCircle className="h-5 w-5 text-destructive" />
                 <span className="text-sm text-muted-foreground hidden sm:inline">No Data Found</span>
                <Button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  variant="destructive"
                  size="sm"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {isSeeding ? "Seeding..." : "Seed Database"}
                </Button>
              </div>
            )}
            <nav className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.name}
              </span>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
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
