
'use client';

import { useState, useEffect } from 'react';
import {
  Report,
  AlertPost,
  Trader,
  User,
  getReports,
  getAlerts,
  getTraders,
  getUsers,
  resolveReport as resolveReportInDb
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

export function ComplaintManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [reportsData, alertsData, tradersData, usersData] = await Promise.all([
          getReports(),
          getAlerts(),
          getTraders(),
          getUsers()
        ]);
        setReports(reportsData);
        setAlerts(alertsData);
        setTraders(tradersData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch complaint data:", error);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось загрузить данные жалоб."})
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const resolveReport = async (reportId: string) => {
    try {
        await resolveReportInDb(reportId);
        setReports((currentReports) => currentReports.filter((report) => report.id !== reportId));
        toast({
            title: 'Жалоба разрешена',
            description: 'Жалоба была отмечена как разрешенная.',
        });
    } catch (error) {
        console.error("Failed to resolve report:", error);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось разрешить жалобу."});
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const adminAsUser: User | undefined = users.find(u => u.id === 'admin-1');

  if (loading) {
      return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold">Очередь жалоб</h2>
      {pendingReports.length > 0 && adminAsUser ? (
        <div className="space-y-6">
          {pendingReports.map((report) => {
            const alert = alerts.find((a) => a.id === report.alertId);
            const trader = alert ? traders.find((t) => t.id === alert.traderId) : undefined;
            const reporter = users.find(u => u.id === report.reporterId);

            if (!alert || !trader) return null;

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
                            onClick={() => resolveReport(report.id)}
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
                    trader={trader}
                    currentUser={adminAsUser}
                    onUpdateAlert={() => {}}
                    onReport={() => {}}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">Очередь жалоб пуста.</p>
        </div>
      )}
    </div>
  );
}
