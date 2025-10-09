
'use client';
import { useState, useEffect } from 'react';
import { Trader, getTrader } from '@/lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import { TraderDashboard } from "@/components/trader/trader-dashboard";
import { RatingView } from '@/components/user/rating-view';
import { User as UserIcon, BarChart, Star, Flame } from "lucide-react";
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AllAlertsView } from '@/components/trader/all-alerts-view';
import { ResponsiveTabs } from '@/components/common/responsive-tabs';


function TraderInfo({ trader }: { trader: Trader }) {
    if (!trader) return null;

    return (
        <Card className="mb-8">
            <CardHeader className="flex flex-col md:flex-row items-start gap-6 p-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={trader.profilePicUrl} alt={trader.name} data-ai-hint={trader.profilePicHint}/>
                    <AvatarFallback className="text-3xl">
                    {trader.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">{trader.name}</h1>
                        <p className="text-muted-foreground mt-1">{trader.specialization}</p>
                    </div>
                     <Badge
                        variant={trader.status === 'active' ? 'default' : 'secondary'}
                        className={`mt-2 sm:mt-0 ${
                        trader.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                    >
                        {trader.status === 'active' ? 'Активен' : 'Неактивен'}
                    </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-400" />
                            <span className="font-bold text-lg">{trader.reputation}</span>
                            <span className="text-sm text-muted-foreground">Рейтинг</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

const tabTriggers = [
    { value: "profile", label: "Профиль", icon: UserIcon },
    { value: "rating", label: "Рейтинг", icon: BarChart },
    { value: "all-alerts", label: "Все алерты", icon: Flame },
];


export default function TraderPage() {
    const { user: authUser } = useAuth();
    const [currentTrader, setCurrentTrader] = useState<Trader | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authUser) return;

        async function fetchTrader() {
            setLoading(true);
            const traderData = await getTrader(authUser.uid);
            setCurrentTrader(traderData);
            setLoading(false);
        }

        fetchTrader();

    }, [authUser]);

    const tabContents = [
        {
            value: "profile",
            children: (
                <>
                    {loading || !currentTrader ? (
                        <div className="mb-8">
                            <Skeleton className="h-40 w-full" />
                        </div>
                    ) : (
                        <TraderInfo trader={currentTrader} />
                    )}
                    <TraderDashboard />
                </>
            )
        },
        {
            value: "rating",
            children: <RatingView />
        },
        {
            value: "all-alerts",
            children: (
                 loading || !currentTrader ? (
                     <div className="space-y-4">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                     </div>
                ) : (
                    <AllAlertsView currentUser={currentTrader} />
                )
            )
        }
    ]


    return (
        <ResponsiveTabs
            defaultValue="profile"
            triggers={tabTriggers}
            contents={tabContents}
            isTrader={true}
        />
    );
}
