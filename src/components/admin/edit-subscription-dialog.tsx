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
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
  const [newEndDate, setNewEndDate] = useState<Date | null>(new Date());
  const [newEndDateString, setNewEndDateString] = useState<string>('');


  useEffect(() => {
    if (user) {
        const endDate = user.subscriptionEndDate ? (user.subscriptionEndDate as Timestamp).toDate() : new Date();
        const daysLeft = differenceInCalendarDays(endDate, new Date());
        setDays(daysLeft >= 0 ? daysLeft + 1 : 0);
    } else {
        setDays(0);
    }
  }, [user]);

  useEffect(() => {
    try {
        const numDays = typeof days === 'number' ? days : parseInt(String(days), 10);
        if (isNaN(numDays)) {
            setNewEndDate(null);
            setNewEndDateString('Invalid time');
            return;
        }

        if (numDays === 0) {
            setNewEndDate(null);
            setNewEndDateString('Нет');
        } else {
            const calculatedDate = addDays(new Date(), numDays - 1);
            setNewEndDate(calculatedDate);
            setNewEndDateString(format(calculatedDate, 'PPP', { locale: ru }));
        }
    } catch (e) {
        setNewEndDate(null);
        setNewEndDateString('Invalid time');
    }
}, [days]);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        setDays('');
        return;
    }
    // Allow only whole numbers
    if (/^\d*$/.test(value)) {
        const num = parseInt(value, 10);
        setDays(num);
    }
  };

  const handleSave = () => {
    const numDays = typeof days === 'number' ? days : parseInt(String(days), 10);
    if (isNaN(numDays) || numDays < 0) return;

    const finalEndDate = addDays(new Date(), numDays > 0 ? numDays - 1 : -1);
    onSave(user.id, finalEndDate);
  };

  const handleReset = () => {
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() - 1); // Set to yesterday to make it expired
    onSave(user.id, resetDate);
  }
  
  const currentEndDate = user.subscriptionEndDate ? (user.subscriptionEndDate as Timestamp).toDate() : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать подписку</DialogTitle>
          <DialogDescription>
            Управление подпиской для пользователя {user.name}.
          </DialogDescription>
        </DialogHeader>
        <div className='text-sm text-muted-foreground -mt-4'>
            <div className='text-xs space-y-1'>
                <div>Текущая дата окончания: {currentEndDate ? format(currentEndDate, 'PPP', { locale: ru }) : 'Нет'}</div>
                <div>Новая дата окончания: {newEndDateString}</div>
            </div>
        </div>
        <div className="space-y-4">
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