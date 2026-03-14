import { getDashboardData } from "./actions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingPieChart } from "@/components/dashboard/spending-pie-chart";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Gagal memuat data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{data.currentMonth}</p>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalBalance={data.totalBalance}
        monthlyIncome={data.monthlyIncome}
        monthlyExpense={data.monthlyExpense}
        currentMonth={data.currentMonth}
      />

      {/* Charts Row 1: Pie + Bar */}
      <div className="grid gap-4 md:grid-cols-2">
        <SpendingPieChart
          data={data.spendingByCategory}
          totalExpense={data.monthlyExpense}
        />
        <MonthlyBarChart data={data.monthlyTrend} />
      </div>

      {/* Charts Row 2: Line Chart */}
      <DailyTrendChart data={data.dailyData} />

      {/* Recent Transactions */}
      <RecentTransactions transactions={data.recentTransactions || []} />
    </div>
  );
}
