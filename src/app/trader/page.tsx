import { TraderLayout } from "@/components/trader/trader-layout";
import { TraderDashboard } from "@/components/trader/trader-dashboard";

export default function TraderPage() {
    return (
        <TraderLayout>
            <TraderDashboard />
        </TraderLayout>
    );
}
