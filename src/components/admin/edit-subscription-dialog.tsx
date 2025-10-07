
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
import { addDays, differenceInCalendarDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Input } from '../ui/input';

type EditSubscriptionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (userId: string, newEndDate: Date) => void;
};

export function EditSubscriptionDialog({ isOpen, onClose, user, onSave }: EditSubscriptionDialogProps) {
  const [days, setDays] = useState<number | string>(0);

  useEffect(() => {
    if (user && user.subscriptionEndDate) {
        const endDate = (user.subscriptionEndDate as Timestamp).toDate();
        const daysLeft = differenceInCalendarDays(endDate, new Date());
        setDays(daysLeft >= 0 ? daysLeft + 1 : 0);
    } else {
        setDays(0);
    }
  }, [user]);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        setDays('');
        return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
        setDays(num);
    }
  };

  const handleSave = () => {
    const numDays = typeof days === 'number' ? days : parseInt(days, 10);
    if (isNaN(numDays)) return;

    const newEndDate = addDays(new Date(), numDays > 0 ? numDays - 1 : -1);
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
                 <Label>Установить количество дней</Label>
                 <Input 
                    type="text" 
                    value={days}
                    onChange={handleDayChange}
                    className="text-center text-2xl font-bold h-14"
                    placeholder='0'
                 />
                 <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDays(d => Number(d) + 7)}>+7 д</Button>
                    <Button variant="outline" size="sm" onClick={() => setDays(d => Number(d) + 30)}>+30 д</Button>
                    <Button variant="outline" size="sm" onClick={() => setDays(d => Number(d) + 90)}>+90 д</Button>
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
