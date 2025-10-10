
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
  getAlerts,
  deleteAlert,
} from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { PaginationControl } from '../common/pagination-control';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const REPORTS_PER_PAGE = 20;

export function ComplaintManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [reportsData, alertsData, tradersData, usersData] = await Promise.all([
          getAllReports({ page: currentPage, limit: REPORTS_PER_PAGE }),
          getAlerts(),
          getAllTraders(),
          getAllUsers()
        ]);
        
        const pending = reportsData.data.filter(r => r.status === 'pending');
        
        setReports(pending);
        setTotalReports(reportsData.totalCount);
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
  }, [toast, currentPage]);

  const handleResolveReport = async (reportId: string) => {
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
    }
  };

  const handleDeletePost = async (alertId: string, reportId: string) => {
    setReports((currentReports) => currentReports.filter((report) => report.id !== reportId));
    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== alertId));

    try {
        await deleteAlert(alertId);
        await resolveReport(db, reportId);
        toast({ variant: 'destructive', title: "Пост удален", description: "Пост был удален, а жалоба разрешена."})
    } catch (error) {
        console.error("Failed to delete post:", error);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось удалить пост."})
    }
  }

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };
  
  const pageCount = Math.ceil(totalReports / REPORTS_PER_PAGE);

  const currentUser = adminUser ? users.find(u => u.id === adminUser.uid) : undefined;

  if (loading) {
      return (
        <div className="space-y-4">
            <h2 className="text-2xl font-headline font-bold">Очередь жалоб</h2>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold">Очередь жалоб</h2>
      {reports.length > 0 && currentUser ? (
        <div className="space-y-6">
          {reports.map((report) => {
            const alert = alerts.find((a) => a.id === report.alertId);
            const reporter = users.find(u => u.id === report.reporterId);

            if (!alert) return null;

            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Жалоба на пост</CardTitle>
                        <CardDescription>
                            От: {reporter?.name || 'Неизвестный пользователь'}
                            <span className="mx-2 text-muted-foreground/50">|</span>
                            {format(new Date((report.createdAt as Timestamp).toDate()), 'd MMMM yyyy, HH:mm', { locale: ru })}
                        </CardDescription>
                    </div>
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
                 <CardFooter className="p-4 flex gap-2 border-t bg-muted/50">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">Разрешить жалобу</Button>
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
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="flex-1">Удалить пост</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Удалить этот пост?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие удалит пост и закроет жалобу. Действие нельзя отменить.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleDeletePost(alert.id, report.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Удалить пост
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
          {pageCount > 1 && (
            <PaginationControl
              pageCount={pageCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">Очередь жалоб пуста.</p>
        </div>
      )}
    </div>
  );
}
