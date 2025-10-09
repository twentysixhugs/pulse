
'use client';

import { useState } from 'react';
import { UserManagement } from "@/components/admin/user-management";
import { TraderManagement } from "@/components/admin/trader-management";
import { ComplaintManagement } from "@/components/admin/complaint-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GanttChartSquare, ShieldAlert, LineChart, FolderKanban } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricsManagement } from './metrics-management';
import { CategoryManagement } from './category-management';


const TABS = [
    { value: "users", label: "Пользователи", icon: Users },
    { value: "traders", label: "Трейдеры", icon: GanttChartSquare },
    { value: "categories", label: "Категории", icon: FolderKanban },
    { value: "complaints", label: "Жалобы", icon: ShieldAlert },
    { value: "metrics", label: "Метрики", icon: LineChart },
];


export function AdminTabs() {
    const [activeTab, setActiveTab] = useState('users');
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <div>
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите раздел" />
                    </SelectTrigger>
                    <SelectContent>
                        {TABS.map(tab => (
                            <SelectItem key={tab.value} value={tab.value}>
                                <div className="flex items-center gap-2">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="mt-6">
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'traders' && <TraderManagement />}
                    {activeTab === 'categories' && <CategoryManagement />}
                    {activeTab === 'complaints' && <ComplaintManagement />}
                    {activeTab === 'metrics' && <MetricsManagement />}
                </div>
            </div>
        )
    }

    return (
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto">
                 {TABS.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                        <tab.icon className="mr-2 h-4 w-4" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            <TabsContent value="users" className="mt-6">
                <UserManagement />
            </TabsContent>
            <TabsContent value="traders" className="mt-6">
                <TraderManagement />
            </TabsContent>
             <TabsContent value="categories" className="mt-6">
                <CategoryManagement />
            </TabsContent>
            <TabsContent value="complaints" className="mt-6">
                <ComplaintManagement />
            </TabsContent>
            <TabsContent value="metrics" className="mt-6">
                <MetricsManagement />
            </TabsContent>
        </Tabs>
    );
}
