import { getInvestmentAccounts, getInvestmentGainLoss } from "./actions";
import { getInvestmentLogs } from "@/app/(dashboard)/accounts/actions";
import { InvestmentsList } from "./investments-list";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [accounts, gainLoss, logs] = await Promise.all([
    getInvestmentAccounts(),
    getInvestmentGainLoss(),
    getInvestmentLogs(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">Investasi</h1>
          <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
            Kelola dan pantau portofolio investasi Anda
          </p>
        </div>
      </div>

      <InvestmentsList
        initialAccounts={accounts}
        initialGainLoss={gainLoss}
        initialLogs={logs}
      />
    </div>
  );
}
