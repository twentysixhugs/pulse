
'use client';

import { useState, useEffect } from 'react';
import {
  Report,
  AlertPost,
  Trader,
  User,
  getAllReports,
  getAllTraders,
  getAllUsers,
  resolveReport,
  getAlerts
} from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCard } from '@/components/user/alert-card';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';

export function ComplaintManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [reportsData, alertsData, tradersData, usersData] = await Promise.all([
          getAllReports(),
          getAlerts(),
          getAllTraders(),
          getAllUsers()
        ]);
        setReports(reportsData);
        setAlerts(alertsData.alerts);
        setTraders(tradersData.data);
        setUsers(usersData.data);
      } catch (error) {
        console.error("Failed to fetch complaint data:", error);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось загрузить данные жалоб."})
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const handleResolveReport = async (reportId: string) => {
    // Optimistic update
    setReports((currentReports) => currentReports.filter((report) => report.id !== reportId));
    
    try {
        await resolveReport(db, reportId);
        toast({
            title: 'Жалоба разрешена',
            description: 'Жалоба была отмечена как разрешенная.',
        });
    } catch (error) {
        console.error("Failed to resolve report:", error);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось разрешить жалобу."});
        // Revert optimistic update if API call fails
        // This requires refetching or storing the removed item temporarily
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const currentUser = adminUser ? users.find(u => u.id === adminUser.uid) : undefined;

  if (loading) {
      return (
        <div className="space-y-4">
            <h2 className="text-2xl font-headline font-bold px-4 md:px-0">Очередь жалоб</h2>
            <div className="space-y-4 px-4 md:px-0">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold px-4 md:px-0">Очередь жалоб</h2>
      {pendingReports.length > 0 && currentUser ? (
        <div className="space-y-6 px-4 md:px-0">
          {pendingReports.map((report) => {
            const alert = alerts.find((a) => a.id === report.alertId);
            const reporter = users.find(u => u.id === report.reporterId);

            if (!alert) return null;

            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">Пост, на который пожаловались</CardTitle>
                        <CardDescription>
                            Жалоба от: {reporter?.name || 'Неизвестный пользователь'}
                        </CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm">Разрешить</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Разрешить жалобу?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Отметка этой жалобы как разрешенной удалит ее из очереди. Это действие нельзя будет отменить.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                            onClick={() => handleResolveReport(report.id)}
                            >
                            Отметить как разрешенную
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Причина жалобы:</h4>
                        <p className="text-muted-foreground text-sm border-l-2 border-primary pl-3">{report.reason}</p>
                    </div>
                  <AlertCard
                    alert={alert}
                    currentUser={currentUser}
                    onUpdateAlert={() => {}}
                    onReport={() => {}}
                    interactionsDisabled={true}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg mx-4 md:mx-0">
          <p className="text-muted-foreground">Очередь жалоб пуста.</p>
        </div>
      )}
    </div>
  );
}
