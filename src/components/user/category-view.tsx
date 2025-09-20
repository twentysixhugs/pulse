'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Category, Trader } from '@/lib/data';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type CategoryViewProps = {
  categories: Category[];
  traders: Trader[];
};

export function CategoryView({ categories, traders }: CategoryViewProps) {
  const activeTraders = traders.filter(t => t.status === 'active');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Просмотр по категориям</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {categories.map((category) => {
            const tradersInCategory = activeTraders.filter(
              (trader) => trader.category === category.id
            );
            return (
              <AccordionItem value={category.id} key={category.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg">{category.name}</span>
                    <Badge variant="secondary">{tradersInCategory.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 pt-2">
                    {tradersInCategory.length > 0 ? (
                      tradersInCategory.map((trader) => (
                        <Link
                          href={`/traders/${trader.id}`}
                          key={trader.id}
                          className="flex items-center justify-between rounded-md p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={trader.profilePicUrl} alt={trader.name} data-ai-hint={trader.profilePicHint}/>
                              <AvatarFallback>
                                {trader.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{trader.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {trader.specialization}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                      ))
                    ) : (
                      <p className="p-3 text-muted-foreground">
                        В этой категории нет активных трейдеров.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
