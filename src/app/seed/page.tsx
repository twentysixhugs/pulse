
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedDatabase } from '@/lib/seed-db';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signInAnonymously, getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/lib/firebase';


export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      
      await signInAnonymously(auth);

      const result = await seedDatabase(db);
      toast({
        title: 'Заполнение базы данных',
        description: result.message,
      });
      setIsDone(true);
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Заполнение базы данных</CardTitle>
          <CardDescription>
            Нажмите кнопку ниже, чтобы заполнить вашу базу данных Firestore начальными данными. Это перезапишет любые существующие данные с теми же идентификаторами.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDone ? (
             <div className="flex flex-col items-center gap-4 text-center">
                <p className='text-green-500'>База данных успешно заполнена!</p>
                <Button asChild>
                    <Link href="/">Перейти на главную страницу</Link>
                </Button>
            </div>
          ) : (
            <Button
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSeeding ? 'Заполнение...' : 'Заполнить базу данных'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
