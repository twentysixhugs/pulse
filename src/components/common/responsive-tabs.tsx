
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type TabTriggerData = {
    value: string;
    label: string;
    icon: React.ElementType;
};

type TabContentData = {
    value: string;
    children: React.ReactNode;
};

type ResponsiveTabsProps = {
    triggers: TabTriggerData[];
    contents: TabContentData[];
    defaultValue: string;
    isTrader?: boolean;
};

export function ResponsiveTabs({ triggers, contents, defaultValue, isTrader = false }: ResponsiveTabsProps) {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = React.useState(defaultValue);

    const tabsListClassName = isTrader 
        ? "grid h-auto grid-cols-2 sm:grid-cols-3" 
        : "flex flex-wrap h-auto";

    return (
        <Tabs defaultValue={defaultValue} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={tabsListClassName}>
                 {triggers.map((trigger, index) => {
                    const isThirdTraderTab = isTrader && index === 2;
                    return (
                        <TabsTrigger 
                            key={trigger.value} 
                            value={trigger.value} 
                            className={isTrader ? (isThirdTraderTab ? "col-span-2 sm:col-span-1" : "") : "flex-1"}
                        >
                            <trigger.icon className="mr-2 h-4 w-4" />
                            {trigger.label}
                        </TabsTrigger>
                    )
                 })}
            </TabsList>
            {contents.map(content => (
                <TabsContent key={content.value} value={content.value} className="mt-6">
                    {content.children}
                </TabsContent>
            ))}
        </Tabs>
    );
}
