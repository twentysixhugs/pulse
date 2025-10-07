
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
import { RefreshCcw, Plus, Minus } from 'lucide-react';
import { addDays, differenceInDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

type EditSubscriptionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (userId: string, newEndDate: Date) => void;
};

export function EditSubscriptionDialog({ isOpen, onClose, user, onSave }: EditSubscriptionDialogProps) {
  const [days, setDays] = useState<number>(30);

  const handleSave = (numDays: number) => {
    let newEndDate;
    const currentEndDate = user.subscriptionEndDate 
        ? (user.subscriptionEndDate as Timestamp).toDate() 
        : new Date();
    
    // If subscription is already expired, start counting from today
    if (differenceInDays(currentEndDate, new Date()) < 0) {
         newEndDate = addDays(new Date(), numDays);
    } else {
        newEndDate = addDays(currentEndDate, numDays);
    }

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
            <div className='space-y-2'>
                 <Label htmlFor="days">Количество дней</Label>
                 <Input 
                    id="days"
                    type="number"
                    value={days}
                    onChange={(e) => setDays(Math.abs(parseInt(e.target.value, 10)))}
                 />
            </div>
            <div className="flex gap-2">
                 <Button onClick={() => handleSave(days)} className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить
                 </Button>
                 <Button onClick={() => handleSave(-days)} className="flex-1" variant="outline">
                    <Minus className="mr-2 h-4 w-4" />
                    Убрать
                 </Button>
            </div>
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
