
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Category, Trader } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';

type RatingViewProps = {
  traders: Trader[];
  categories: Category[];
};

export function RatingView({ traders, categories }: RatingViewProps) {
  const sortedTraders = [...traders]
    .filter(t => t.status === 'active')
    .sort((a, b) => {
      const scoreA = a.reputation.positive - a.reputation.negative;
      const scoreB = b.reputation.positive - b.reputation.negative;
      return scoreB - scoreA;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Топ трейдеров</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Место</TableHead>
              <TableHead>Трейдер</TableHead>
              <TableHead className="text-center">Счет</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTraders.map((trader, index) => {
              const score = trader.reputation.positive - trader.reputation.negative;
              const category = categories.find(c => c.id === trader.category);
              return (
                <TableRow key={trader.id}>
                  <TableCell className="text-center font-bold text-lg">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/traders/${trader.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar>
                          <AvatarImage src={trader.profilePicUrl} alt={trader.name} data-ai-hint={trader.profilePicHint}/>
                          <AvatarFallback>
                          {trader.name.charAt(0)}
                          </AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="font-semibold group-hover:underline group-hover:text-primary">{trader.name}</p>
                          <p className="text-sm text-muted-foreground">{category?.name || 'Без категории'}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center font-bold text-lg">
                    {score}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
