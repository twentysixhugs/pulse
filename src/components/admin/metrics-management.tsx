
'use client';

import { useState, useEffect } from 'react';
import { getMetrics, Metrics } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Newspaper, CalendarPlus, CalendarX, Repeat, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

type Period = 'today' | '7d';

const MetricCard = ({ title, value, icon: Icon, loading }: { title: string, value: number, icon: React.ElementType, loading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);

export function MetricsManagement() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('today');
    const { toast } = useToast();
    const isMobile = useIsMobile();

    useEffect(() => {
        async function fetchMetrics() {
            setLoading(true);
            try {
                const data = await getMetrics(period);
                setMetrics(data);
            } catch (error) {
                console.error("Failed to fetch metrics:", error);
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить метрики.' });
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, [period, toast]);

    const metricItems = [
        { title: "Всего подписчиков", value: metrics?.totalSubscribedUsers, icon: Users },
        { title: "Новые пользователи", value: metrics?.newUsers, icon: CalendarPlus },
        { title: "Новые подписки", value: metrics?.newlySubscribedUsers, icon: TrendingUp },
        { title: "Продления", value: metrics?.renewedSubscriptions, icon: Repeat },
        { title: "Не продлили", value: metrics?.expiredSubscriptions, icon: CalendarX },
        { title: "Посты трейдеров", value: metrics?.traderPosts, icon: Newspaper },
    ];
    
    const PeriodSelector = () => {
        if (isMobile) {
            return (
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Период" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Сегодня</SelectItem>
                        <SelectItem value="7d">7 дней</SelectItem>
                    </SelectContent>
                </Select>
            )
        }
        return (
            <Tabs defaultValue={period} onValueChange={(v) => setPeriod(v as Period)}>
                <TabsList>
                    <TabsTrigger value="today">Сегодня</TabsTrigger>
                    <TabsTrigger value="7d">7 дней</TabsTrigger>
                </TabsList>
            </Tabs>
        )
    }

    return (
        <div className="space-y-4 px-4 md:px-0">
             <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h2 className="text-2xl font-headline font-bold self-start">Ключевые метрики</h2>
                <PeriodSelector />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {metricItems.map(item => (
                   <MetricCard 
                        key={item.title}
                        title={item.title}
                        value={item.value ?? 0}
                        icon={item.icon}
                        loading={loading}
                    />
               ))}
            </div>
        </div>
    );
}
