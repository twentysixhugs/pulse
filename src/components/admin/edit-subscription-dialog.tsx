
'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
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
  const [daysToAdd, setDaysToAdd] = useState<number>(30);

  const handleSave = (days: number, isReset = false) => {
    let newEndDate;
    if (isReset) {
      newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() - 1); // Set to yesterday to make it expired
    } else {
        const currentEndDate = user.subscriptionEndDate 
            ? (user.subscriptionEndDate as Timestamp).toDate() 
            : new Date();
      
        if (differenceInDays(currentEndDate, new Date()) < 0) {
             newEndDate = addDays(new Date(), days);
        } else {
            newEndDate = addDays(currentEndDate, days);
        }
    }
    onSave(user.id, newEndDate);
  };
  
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
            <div className='space-y-2'>
                 <Label htmlFor="days">Добавить/убрать дни</Label>
                 <Input 
                    id="days"
                    type="number"
                    value={daysToAdd}
                    onChange={(e) => setDaysToAdd(parseInt(e.target.value, 10))}
                 />
            </div>
            <div className="flex gap-2">
                 <Button onClick={() => handleSave(daysToAdd)} className="flex-1">
                    Применить
                 </Button>
                 <Button onClick={() => handleSave(0, true)} variant="destructive" size="icon">
                    <RefreshCcw className="h-4 w-4" />
                    <span className="sr-only">Сбросить подписку</span>
                 </Button>
            </div>
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

    