'use client';

import { useState } from 'react';
import { Trader, traders as initialTraders } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TraderManagement() {
  const [traders, setTraders] = useState<Trader[]>(initialTraders);
  const { toast } = useToast();

  const toggleTraderStatus = (traderId: string) => {
    setTraders((currentTraders) =>
      currentTraders.map((trader) => {
        if (trader.id === traderId) {
          const newStatus = trader.status === 'active' ? 'inactive' : 'active';
          toast({
            title: `Trader ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
            description: `${trader.name} has been ${newStatus}.`,
          });
          return { ...trader, status: newStatus };
        }
        return trader;
      })
    );
  };
  
  const deleteTrader = (traderId: string) => {
    setTraders((currentTraders) => {
      const trader = currentTraders.find(t => t.id === traderId);
      toast({
        variant: 'destructive',
        title: 'Trader Deleted',
        description: `${trader?.name} has been permanently deleted.`
      })
      return currentTraders.filter(t => t.id !== traderId)
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold">Manage Traders</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traders.map((trader) => (
              <TableRow key={trader.id}>
                <TableCell className="font-medium">{trader.name}</TableCell>
                <TableCell>{trader.specialization}</TableCell>
                <TableCell>{trader.telegramId}</TableCell>
                <TableCell>
                  <Badge
                    variant={trader.status === 'active' ? 'default' : 'secondary'}
                    className={
                      trader.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {trader.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleTraderStatus(trader.id)}>
                            {trader.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Edit Posts</DropdownMenuItem>
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                Delete Trader
                            </DropdownMenuItem>
                         </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>

                     <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Trader?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete {trader.name} and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTrader(trader.id)}
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                          Confirm Deletion
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
