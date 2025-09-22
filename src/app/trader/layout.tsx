
'use client';
import { TraderLayout } from "@/components/trader/trader-layout";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user?.role !== 'trader') {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || user?.role !== 'trader') {
        return <div className="w-screen h-screen flex items-center justify-center">Загрузка...</div>;
    }
    
    return <TraderLayout>{children}</TraderLayout>;
}
