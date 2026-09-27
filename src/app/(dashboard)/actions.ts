"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { todayWIB } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from "date-fns";

type AmountRow = { type: string; amount: number | string };

const sumByType = (rows: AmountRow[], type: string) =>
  rows.filter((t) => t.type === type).reduce((sum, t) => sum + Number(t.amount), 0);

const dateRange = (date: Date) =>
  [format(startOfMonth(date), "yyyy-MM-dd"), format(endOfMonth(date), "yyyy-MM-dd")] as const;

export async function getDashboardData(month?: string) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) return null;

  // Parse month or use current (WIB: the server runs in UTC)
  const today = new Date(todayWIB());
  const targetDate = month ? new Date(month + "-01") : today;
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const [monthStartStr, monthEndStr] = dateRange(targetDate);

  // Trend always covers the last 6 months from today (not from the selected month)
  const trendMonths = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i));

  // All queries are independent, so they run as one parallel wave instead of 12 sequential round trips.
  // Trend stays one query per month so each stays well under PostgREST's 1000-row cap.
  const [accountsRes, monthRes, recentRes, trendResList] = await Promise.all([
    supabase.from("accounts").select("balance, type").eq("user_id", user.id),
    supabase
      .from("transactions")
      .select("date, type, amount, categories(name, icon, color, budget)")
      .eq("user_id", user.id)
      .gte("date", monthStartStr)
      .lte("date", monthEndStr),
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), accounts(name)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    Promise.all(
      trendMonths.map((monthDate) => {
        const [start, end] = dateRange(monthDate);
        return supabase
          .from("transactions")
          .select("type, amount")
          .eq("user_id", user.id)
          .gte("date", start)
          .lte("date", end);
      })
    ),
  ]);

  // 1. Balances
  const accounts = accountsRes.data || [];
  const sumBalance = (filter: (type: string) => boolean) =>
    accounts.filter((a) => filter(a.type)).reduce((sum, acc) => sum + Number(acc.balance), 0);

  const totalBalance = sumBalance(() => true);
  const walletBalance = sumBalance((type) => type !== "investment");
  const cashBalance = sumBalance((type) => type === "cash");
  const digitalBalance = sumBalance((type) => type === "bank" || type === "ewallet");
  const investmentBalance = sumBalance((type) => type === "investment");

  // 2. Monthly totals
  const monthTransactions = monthRes.data || [];
  const monthlyIncome = sumByType(monthTransactions, "income");
  const monthlyExpense = sumByType(monthTransactions, "expense");

  // 3. Spending by category
  const categoryMap: Record<string, { name: string; icon: string; color: string; total: number; budget: number | null }> = {};
  monthTransactions
    .filter((t) => t.type === "expense")
    .forEach((t: any) => {
      const catName = t.categories?.name || "Lainnya";
      if (!categoryMap[catName]) {
        categoryMap[catName] = {
          name: catName,
          icon: t.categories?.icon || "📦",
          color: t.categories?.color || "#6B7280",
          budget: t.categories?.budget || null,
          total: 0,
        };
      }
      categoryMap[catName].total += Number(t.amount);
    });

  const spendingByCategory = Object.values(categoryMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6); // Top 6 categories

  // 4. Daily spending for the month (for line chart)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyData = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayTransactions = monthTransactions.filter((t) => t.date === dayStr);

    return {
      date: format(day, "dd"),
      fullDate: dayStr,
      income: sumByType(dayTransactions, "income"),
      expense: sumByType(dayTransactions, "expense"),
    };
  });

  // 5. Monthly trend (last 6 months)
  const monthlyTrend = trendMonths.map((monthDate, i) => {
    const rows = trendResList[i].data || [];
    return {
      month: format(monthDate, "MMM"),
      fullMonth: format(monthDate, "MMMM yyyy"),
      income: sumByType(rows, "income"),
      expense: sumByType(rows, "expense"),
    };
  });

  return {
    totalBalance,
    walletBalance,
    cashBalance,
    digitalBalance,
    investmentBalance,
    monthlyIncome,
    monthlyExpense,
    spendingByCategory,
    dailyData,
    monthlyTrend,
    recentTransactions: recentRes.data,
    currentMonth: format(targetDate, "MMMM yyyy"),
  };
}
