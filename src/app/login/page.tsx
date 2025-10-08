
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/common/logo';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      // The AuthProvider will handle redirection
    } catch (error: any) {
        let errorMessage = 'Произошла неизвестная ошибка.';
        if (error.message === "Ваш аккаунт забанен.") {
            errorMessage = "Доступ запрещен. Ваш аккаунт был заблокирован.";
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Неправильный email или пароль.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Неверный формат email.';
        }
        
      toast({
        variant: 'destructive',
        title: 'Ошибка входа',
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
        const targetPath = user.role === 'admin' ? '/admin' : user.role === 'trader' ? '/trader' : '/';
        router.replace(targetPath);
    }
  }, [user, router]);


  if (user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
             <div className="w-full max-w-sm text-center">
                Загрузка...
             </div>
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="font-headline text-2xl">Вход в аккаунт</CardTitle>
          <CardDescription>Введите ваш email и пароль для доступа.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
             <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
