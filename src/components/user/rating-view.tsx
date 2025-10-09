
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Category, Trader, getAllTraders, getAllCategories } from '@/lib/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';

export function RatingView() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [tradersData, categoriesData] = await Promise.all([
        getAllTraders(),
        getAllCategories(),
      ]);
      setTraders(tradersData.data);
      setCategories(categoriesData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const sortedTraders = traders
    .filter(t => t.status === 'active')
    .sort((a, b) => (b.reputation || 0) - (a.reputation || 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Топ трейдеров</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center text-xs">Место</TableHead>
                <TableHead className="text-xs">Трейдер</TableHead>
                <TableHead className="text-center text-xs">Счет</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTraders.map((trader, index) => {
                const score = trader.reputation || 0;
                const category = categories.find(c => c.id === trader.category);
                return (
                  <TableRow key={trader.id}>
                    <TableCell className="text-center font-bold">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/traders/${trader.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={trader.profilePicUrl} alt={trader.name} data-ai-hint={trader.profilePicHint}/>
                            <AvatarFallback>
                            {trader.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold group-hover:underline group-hover:text-primary text-sm">{trader.name}</p>
                            <p className="text-xs text-muted-foreground">{category?.name || 'Без категории'}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {score}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
