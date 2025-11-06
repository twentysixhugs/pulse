
'use client';
import { TraderLayout } from "@/components/trader/trader-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, loading, error, hasRole, refresh } = useAuth();

    if (loading) {
        return <div className="w-screen h-screen flex items-center justify-center">Загрузка...</div>;
    }

    if (!user || !hasRole('trader')) {
        return (
            <div className="w-screen h-screen flex items-center justify-center text-center px-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-lg font-medium">Доступ ограничен.</p>
                        <p className="text-sm text-muted-foreground mt-2">{error?.message ?? 'Доступ только для трейдеров.'}</p>
                    </div>
                    <Button onClick={refresh} variant="outline" className="mx-auto">
                        <RefreshCw className="h-4 w-4 mr-2" /> Повторить попытку
                    </Button>
                </div>
            </div>
        );
    }

    return <TraderLayout>{children}</TraderLayout>;
}
