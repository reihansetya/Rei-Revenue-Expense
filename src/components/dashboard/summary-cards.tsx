import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  PiggyBank,
} from "lucide-react";
import { FormattedCurrency } from "@/components/ui/formatted-currency";

interface SummaryCardsProps {
  totalBalance: number;
  walletBalance: number;
  investmentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  currentMonth: string;
}

export function SummaryCards({
  totalBalance,
  walletBalance,
  investmentBalance,
  monthlyIncome,
  monthlyExpense,
  currentMonth,
}: SummaryCardsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Balance Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <FormattedCurrency
              amount={totalBalance}
              className="text-2xl font-bold"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dompet</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <FormattedCurrency
              amount={walletBalance}
              className="text-2xl font-bold"
            />
            <p className="text-xs text-muted-foreground">
              Bank, E-Wallet, Cash
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investasi</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <FormattedCurrency
              amount={investmentBalance}
              className="text-2xl font-bold text-purple-600"
            />
            <p className="text-xs text-muted-foreground">
              Saham, Reksadana, Crypto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <FormattedCurrency
              amount={monthlyIncome}
              showSign
              sign="+"
              className="text-2xl font-bold text-emerald-500"
            />
            <p className="text-xs text-muted-foreground">{currentMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <FormattedCurrency
              amount={monthlyExpense}
              showSign
              sign="-"
              className="text-2xl font-bold text-rose-500"
            />
            <p className="text-xs text-muted-foreground">{currentMonth}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
