
'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RefreshCcw } from 'lucide-react';
import { addDays, differenceInDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

type EditSubscriptionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (userId: string, newEndDate: Date) => void;
};

export function EditSubscriptionDialog({ isOpen, onClose, user, onSave }: EditSubscriptionDialogProps) {
  const [days, setDays] = useState<number>(0);

  useEffect(() => {
    if (user && user.subscriptionEndDate) {
        const endDate = (user.subscriptionEndDate as Timestamp).toDate();
        const daysLeft = differenceInDays(endDate, new Date());
        setDays(daysLeft > 0 ? daysLeft : 0);
    } else {
        setDays(0);
    }
  }, [user]);


  const handleSave = () => {
    const newEndDate = addDays(new Date(), days);
    onSave(user.id, newEndDate);
  };

  const handleReset = () => {
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() - 1); // Set to yesterday to make it expired
    onSave(user.id, newEndDate);
  }
  
  const currentEndDate = user.subscriptionEndDate ? (user.subscriptionEndDate as Timestamp).toDate().toLocaleDateString('ru-RU') : 'Нет';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать подписку</DialogTitle>
          <DialogDescription>
            Управление подпиской для пользователя {user.name}. Текущая дата окончания: {currentEndDate}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className='space-y-3'>
                 <Label>Осталось дней</Label>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-2xl font-bold">{days}</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDays(d => d + 7)}>+7 д</Button>
                        <Button variant="outline" size="sm" onClick={() => setDays(d => d + 30)}>+30 д</Button>
                        <Button variant="outline" size="sm" onClick={() => setDays(d => d + 90)}>+90 д</Button>
                    </div>
                 </div>
            </div>
             <Button onClick={handleSave} className="w-full">
                Обновить
             </Button>
             <Button onClick={handleReset} variant="destructive" className="w-full">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Сбросить подписку (сделать неактивной)
             </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
