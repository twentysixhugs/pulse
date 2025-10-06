import { UserManagement } from "@/components/admin/user-management";
import { TraderManagement } from "@/components/admin/trader-management";
import { ComplaintManagement } from "@/components/admin/complaint-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GanttChartSquare, ShieldAlert } from "lucide-react";

export default function AdminPage() {
    return (
        <Tabs defaultValue="users" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="users" className="flex-1">
                    <Users className="mr-2 h-4 w-4" />
                    Пользователи
                </TabsTrigger>
                <TabsTrigger value="traders" className="flex-1">
                    <GanttChartSquare className="mr-2 h-4 w-4" />
                    Трейдеры
                </TabsTrigger>
                <TabsTrigger value="complaints" className="flex-1">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Жалобы
                </TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-6">
                <UserManagement />
            </TabsContent>
            <TabsContent value="traders" className="mt-6">
                <TraderManagement />
            </TabsContent>
            <TabsContent value="complaints" className="mt-6">
                <ComplaintManagement />
            </TabsContent>
        </Tabs>
    );
}
