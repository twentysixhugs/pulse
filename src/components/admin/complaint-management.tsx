'use client';

import { useState } from 'react';
import {
  Report,
  reports as initialReports,
  alerts as initialAlerts,
  traders as initialTraders,
  users as initialUsers,
} from '@/lib/data';
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

export function ComplaintManagement() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const { toast } = useToast();

  const resolveReport = (reportId: string) => {
    setReports((currentReports) =>
      currentReports.map((report) => {
        if (report.id === reportId) {
          toast({
            title: 'Report Resolved',
            description: 'The complaint has been marked as resolved.',
          });
          return { ...report, status: 'resolved' };
        }
        return report;
      })
    );
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold">Complaint Queue</h2>
      {pendingReports.length > 0 ? (
        <div className="space-y-6">
          {pendingReports.map((report) => {
            const alert = initialAlerts.find((a) => a.id === report.alertId);
            const trader = alert ? initialTraders.find((t) => t.id === alert.traderId) : undefined;
            const reporter = initialUsers.find(u => u.id === report.reporterId);

            if (!alert || !trader) return null;

            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">Reported Post</CardTitle>
                        <CardDescription>
                            Reported by: {reporter?.name || 'Unknown User'}
                        </CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm">Resolve</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Resolve Complaint?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Marking this complaint as resolved will remove it from the queue. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                            onClick={() => resolveReport(report.id)}
                            >
                            Mark as Resolved
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Reason for report:</h4>
                        <p className="text-muted-foreground text-sm border-l-2 border-primary pl-3">{report.reason}</p>
                    </div>
                  <AlertCard
                    alert={alert}
                    trader={trader}
                    currentUser={initialUsers[0]}
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
          <p className="text-muted-foreground">The complaint queue is empty.</p>
        </div>
      )}
    </div>
  );
}
