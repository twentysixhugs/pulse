
'use client';

import {
  AlertPost,
  Category,
  Trader,
  User,
  Report,
} from '@/lib/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertCard } from './alert-card';
import { useAuth } from '@/hooks/use-auth';

type TraderProfileViewProps = {
  trader: Trader;
  category: Category | undefined;
  alerts: AlertPost[];
  currentUser: User;
  userRepAction: 'pos' | 'neg' | null;
  onUpdateAlert: (updatedAlert: AlertPost) => void;
  onUpdateTraderRep: (traderId: string, type: 'pos' | 'neg') => void;
  onReport: (report: Omit<Report, 'id' | 'status'>) => void;
};

export function TraderProfileView({
  trader,
  category,
  alerts,
  currentUser,
  userRepAction,
  onUpdateAlert,
  onUpdateTraderRep,
  onReport,
}: TraderProfileViewProps) {
  const { toast } = useToast();
  const { db } = useAuth();

  const handleRep = (type: 'pos' | 'neg') => {
    onUpdateTraderRep(trader.id, type);

    if (userRepAction === type) {
        toast({ title: 'Репутация удалена.' });
    } else if (userRepAction) {
        toast({ title: `Репутация изменена на ${type === 'pos' ? '+Rep' : '-Rep'}.` });
    } else {
        toast({ title: `Вы поставили ${type === 'pos' ? '+Rep' : '-Rep'}.` });
    }
  };

  if (!db) {
    return null; // Or a loading state
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start gap-6 p-6">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={trader.profilePicUrl} alt={trader.name} data-ai-hint={trader.profilePicHint}/>
            <AvatarFallback className="text-3xl">
              {trader.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div>
                <h1 className="text-3xl font-headline font-bold">{trader.name}</h1>
                <p className="text-muted-foreground mt-1">{trader.specialization}</p>
              </div>
              <Badge
                variant={trader.status === 'active' ? 'default' : 'secondary'}
                className={`mt-2 sm:mt-0 ${
                  trader.status === 'active'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {trader.status === 'active' ? 'Активен' : 'Неактивен'}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Badge variant="outline">{category?.name || 'Без категории'}</Badge>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-green-500">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="font-medium">{trader.reputation.positive}</span>
                </div>
                <div className="flex items-center gap-1 text-red-500">
                  <ThumbsDown className="h-4 w-4" />
                  <span className="font-medium">{trader.reputation.negative}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col sm:flex-row gap-2">
            <Button onClick={() => handleRep('pos')} variant={userRepAction === 'pos' ? "default" : "outline"} className="w-full sm:w-auto">
                {userRepAction === 'pos' && <Check className="mr-2 h-4 w-4" />}
                +Rep
            </Button>
             <Button onClick={() => handleRep('neg')} variant={userRepAction === 'neg' ? "destructive" : "outline"} className="w-full sm:w-auto">
                {userRepAction === 'neg' && <Check className="mr-2 h-4 w-4" />}
                -Rep
            </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-headline font-bold mb-4">История постов</h2>
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  currentUser={currentUser}
                  onUpdateAlert={onUpdateAlert}
                  onReport={onReport}
                  db={db}
                />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Этот трейдер еще не оставлял постов.</p>
          </div>
        )}
      </div>
    </div>
  );
}
