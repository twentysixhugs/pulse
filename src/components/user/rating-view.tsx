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
import { Trader } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';

type RatingViewProps = {
  traders: Trader[];
};

export function RatingView({ traders }: RatingViewProps) {
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
        <CardTitle className="font-headline">Trader Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Rank</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center text-green-500">
                <ArrowUp className="inline-block h-4 w-4" />
              </TableHead>
              <TableHead className="text-center text-red-500">
                <ArrowDown className="inline-block h-4 w-4" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTraders.map((trader, index) => {
              const score = trader.reputation.positive - trader.reputation.negative;
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
                          <p className="text-sm text-muted-foreground">{trader.specialization}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center font-bold text-lg">
                    {score}
                  </TableCell>
                  <TableCell className="text-center text-green-500 font-medium">
                    {trader.reputation.positive}
                  </TableCell>
                  <TableCell className="text-center text-red-500 font-medium">
                    {trader.reputation.negative}
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
