
'use client';
import { useState } from 'react';
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Database, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { seedDatabase } from '@/lib/seed-db';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDatabase(db);
      toast({
        title: 'База данных заполнена',
        description: result.message,
      });
    } catch (error: any) {
      console.error('Error seeding database:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка при заполнении',
        description: error.message || 'Произошла неизвестная ошибка.',
      });
    } finally {
      setIsSeeding(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm font-medium text-muted-foreground">/</span>
            <h1 className="text-lg font-headline font-semibold">Admin</h1>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.name}
            </span>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isSeeding}>
                        {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                        <span className="sr-only">Заполнить базу</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                        Это действие перезапишет все данные в вашей базе данных. Существующие данные с теми же идентификаторами будут заменены. Это действие нельзя отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSeed}>
                        Подтвердить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8 px-4">{children}</div>
      </main>
    </div>
  );
}
