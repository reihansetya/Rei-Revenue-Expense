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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investasi</h1>
          <p className="text-sm text-muted-foreground">
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
