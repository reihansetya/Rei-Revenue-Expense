"use server";

import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from "date-fns";

export async function getDashboardData(month?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Parse month or use current
  const targetDate = month ? new Date(month + "-01") : new Date();
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  // 1. Get all accounts for total balance
  const { data: accounts } = await supabase
    .from("accounts")
    .select("balance, type")
    .eq("user_id", user.id);

  const totalBalance = (accounts || []).reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );
  const walletBalance = (accounts || [])
    .filter((a) => a.type !== "investment")
    .reduce((sum, acc) => sum + Number(acc.balance), 0);
  const investmentBalance = (accounts || [])
    .filter((a) => a.type === "investment")
    .reduce((sum, acc) => sum + Number(acc.balance), 0);

  // 2. Get monthly transactions
  const { data: monthlyTransactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", user.id)
    .gte("date", format(monthStart, "yyyy-MM-dd"))
    .lte("date", format(monthEnd, "yyyy-MM-dd"));

  const monthlyIncome = (monthlyTransactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpense = (monthlyTransactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 3. Spending by category
  const { data: categorySpending } = await supabase
    .from("transactions")
    .select("amount, categories(name, icon, color, budget)")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("date", format(monthStart, "yyyy-MM-dd"))
    .lte("date", format(monthEnd, "yyyy-MM-dd"));

  // Group by category
  const categoryMap: Record<string, { name: string; icon: string; color: string; total: number; budget: number | null }> = {};
  (categorySpending || []).forEach((t: any) => {
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
  const { data: dailyTransactions } = await supabase
    .from("transactions")
    .select("date, type, amount")
    .eq("user_id", user.id)
    .gte("date", format(monthStart, "yyyy-MM-dd"))
    .lte("date", format(monthEnd, "yyyy-MM-dd"));

  // Create daily data
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyData = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayTransactions = (dailyTransactions || []).filter(
      (t) => t.date === dayStr
    );
    const income = dayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = dayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      date: format(day, "dd"),
      fullDate: dayStr,
      income,
      expense,
    };
  });

  // 5. Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);

    const { data: mTransactions } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user.id)
      .gte("date", format(mStart, "yyyy-MM-dd"))
      .lte("date", format(mEnd, "yyyy-MM-dd"));

    const income = (mTransactions || [])
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = (mTransactions || [])
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    monthlyTrend.push({
      month: format(monthDate, "MMM"),
      fullMonth: format(monthDate, "MMMM yyyy"),
      income,
      expense,
    });
  }

  // 6. Recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, categories(name, icon, color), accounts(name)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    totalBalance,
    walletBalance,
    investmentBalance,
    monthlyIncome,
    monthlyExpense,
    spendingByCategory,
    dailyData,
    monthlyTrend,
    recentTransactions,
    currentMonth: format(targetDate, "MMMM yyyy"),
  };
}
