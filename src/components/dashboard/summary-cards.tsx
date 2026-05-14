import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Banknote,
  Smartphone,
} from "lucide-react";
import { FormattedCurrency } from "@/components/ui/formatted-currency";

interface SummaryCardsProps {
  totalBalance: number;
  walletBalance: number;
  cashBalance: number;
  digitalBalance: number;
  investmentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  currentMonth: string;
}

export function SummaryCards({
  totalBalance,
  walletBalance,
  cashBalance,
  digitalBalance,
  investmentBalance,
  monthlyIncome,
  monthlyExpense,
  currentMonth,
}: SummaryCardsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Total Saldo — full width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <FormattedCurrency
            amount={totalBalance}
            className="text-2xl font-bold text-white"
          />
          <p className="text-xs text-muted-foreground">Semua akun</p>
        </CardContent>
      </Card>

      {/* Dompet — full width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dompet</CardTitle>
          <Wallet className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <FormattedCurrency
            amount={walletBalance}
            className="text-2xl font-bold text-white"
          />
          <p className="text-xs text-muted-foreground">Cash + Digital</p>
        </CardContent>
      </Card>

      {/* Dompet Cash | Dompet Digital — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Dompet Cash</CardTitle>
            <Banknote className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FormattedCurrency
              amount={cashBalance}
              className="text-base md:text-xl font-bold text-white truncate"
            />
            <p className="text-xs text-muted-foreground">Uang tunai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Dompet Digital</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FormattedCurrency
              amount={digitalBalance}
              className="text-base md:text-xl font-bold text-white truncate"
            />
            <p className="text-xs text-muted-foreground">Bank & E-Wallet</p>
          </CardContent>
        </Card>
      </div>

      {/* Investasi — full width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investasi</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <FormattedCurrency
            amount={investmentBalance}
            className="text-2xl font-bold text-white"
          />
          <p className="text-xs text-muted-foreground">
            Saham, Reksadana, Crypto
          </p>
        </CardContent>
      </Card>

      {/* Pemasukan | Pengeluaran — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Pemasukan</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FormattedCurrency
              amount={monthlyIncome}
              showSign
              sign="+"
              className="text-base md:text-xl font-bold text-emerald-500 truncate"
            />
            <p className="text-xs text-muted-foreground">{currentMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Pengeluaran</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FormattedCurrency
              amount={monthlyExpense}
              showSign
              sign="-"
              className="text-base md:text-xl font-bold text-rose-500 truncate"
            />
            <p className="text-xs text-muted-foreground">{currentMonth}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
