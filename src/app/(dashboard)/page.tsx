"use client";

import { useState } from "react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingPieChart } from "@/components/dashboard/spending-pie-chart";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { useDashboard } from "@/queries/dashboard";
import { format, addMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return format(now, "yyyy-MM");
  });

  const { data, isLoading, error } = useDashboard(currentMonth);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) =>
      format(addMonths(new Date(prev + "-01"), -1), "yyyy-MM"),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) =>
      format(addMonths(new Date(prev + "-01"), 1), "yyyy-MM"),
    );
  };

  const currentMonthLabel = format(
    new Date(currentMonth + "-01"),
    "MMMM yyyy",
    {
      locale: localeId,
    },
  );

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-red-500">Gagal memuat data: {error.message}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{currentMonthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalBalance={data.totalBalance}
        walletBalance={data.walletBalance}
        investmentBalance={data.investmentBalance}
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

      {/* Budget Progress (Only shows if budget is set) */}
      <BudgetProgress data={data.spendingByCategory} />

      {/* Charts Row 2: Line Chart */}
      <DailyTrendChart data={data.dailyData} />

      {/* Recent Transactions */}
      <RecentTransactions transactions={data.recentTransactions || []} />
    </div>
  );
}
