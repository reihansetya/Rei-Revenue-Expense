import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch accounts for total balance
  const { data: accounts } = await supabase
    .from("accounts")
    .select("balance")
    .eq("user_id", user.id);

  const totalBalance = (accounts || []).reduce((sum, acc) => sum + Number(acc.balance), 0);

  // Fetch this month's transactions
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: monthlyTransactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", user.id)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  const monthlyIncome = (monthlyTransactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpense = (monthlyTransactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, categories(name, icon, color), accounts(name)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch spending by category for chart placeholder
  const { data: spendingByCategory } = await supabase
    .from("transactions")
    .select("amount, categories(name, icon, color)")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  const categorySpending: Record<string, { name: string; icon: string; color: string; total: number }> = {};
  (spendingByCategory || []).forEach((t: any) => {
    const catName = t.categories?.name || "Lainnya";
    if (!categorySpending[catName]) {
      categorySpending[catName] = {
        name: catName,
        icon: t.categories?.icon || "📦",
        color: t.categories?.color || "#6B7280",
        total: 0,
      };
    }
    categorySpending[catName].total += Number(t.amount);
  });

  const sortedSpending = Object.values(categorySpending).sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatRupiah(monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {format(now, "MMMM yyyy", { locale: localeId })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{formatRupiah(monthlyExpense)}</div>
            <p className="text-xs text-muted-foreground">
              {format(now, "MMMM yyyy", { locale: localeId })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending + Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Spending by Category */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedSpending.length > 0 ? (
              <div className="space-y-4">
                {sortedSpending.map((cat) => {
                  const percentage = monthlyExpense > 0 ? (cat.total / monthlyExpense) * 100 : 0;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <span className="text-muted-foreground">{formatRupiah(cat.total)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Belum ada pengeluaran bulan ini
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            <Link href="/transactions" className="text-xs text-primary hover:underline">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                        style={{
                          backgroundColor: t.categories
                            ? `${t.categories.color}20`
                            : t.type === "income"
                              ? "#10B98120"
                              : "#EF444420",
                        }}
                      >
                        {t.categories?.icon || (t.type === "income" ? "💰" : "💸")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t.categories?.name || (t.type === "income" ? "Pemasukan" : "Pengeluaran")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.date), "dd MMM", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        t.type === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatRupiah(Number(t.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Belum ada transaksi
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
