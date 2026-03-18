"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import { UpdateBalanceDialog } from "@/app/(dashboard)/accounts/update-balance-dialog";
import { updateInvestmentBalance } from "@/app/(dashboard)/accounts/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  Account,
  InvestmentGainLoss,
  InvestmentBalanceLog,
} from "@/types";

interface InvestmentsListProps {
  initialAccounts: Account[];
  initialGainLoss: InvestmentGainLoss[];
  initialLogs: InvestmentBalanceLog[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export function InvestmentsList({
  initialAccounts,
  initialGainLoss,
  initialLogs,
}: InvestmentsListProps) {
  const [updateAccount, setUpdateAccount] = useState<Account | null>(null);
  const router = useRouter();

  const totalGainLoss = initialGainLoss.reduce(
    (sum, g) => sum + g.total_gain_loss,
    0,
  );
  const totalBalance = initialAccounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );
  const isPositive = totalGainLoss >= 0;

  async function handleUpdateBalance(
    accountId: string,
    newBalance: number,
    notes: string,
  ) {
    const result = await updateInvestmentBalance(
      accountId,
      newBalance,
      notes || undefined,
    );
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Saldo investasi berhasil diupdate", { duration: 1500 });
    router.refresh();
  }

  if (initialAccounts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <PiggyBank className="h-14 w-14 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium mb-1">Belum ada akun investasi</p>
        <p className="text-sm">
          Tambahkan akun dengan tipe <strong>Investasi</strong> di halaman{" "}
          <a href="/accounts" className="text-primary underline">
            Dompet
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Portfolio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <FormattedCurrency
              amount={totalBalance}
              className="text-2xl font-bold text-purple-600 block truncate"
            />
            <p className="text-xs text-muted-foreground">
              {initialAccounts.length} akun investasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Gain / Loss
            </CardTitle>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold truncate ${isPositive ? "text-emerald-600" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(totalGainLoss)}
            </p>
            <p className="text-xs text-muted-foreground">
              Kumulatif semua akun
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-account Gain/Loss */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">List Instrument Investasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {initialGainLoss
            .slice()
            .sort(
              (a, b) => Number(b.current_balance) - Number(a.current_balance),
            )
            .map((item) => {
              const pos = item.total_gain_loss >= 0;
              const Icon =
                item.total_gain_loss === 0
                  ? Minus
                  : pos
                    ? TrendingUp
                    : TrendingDown;
              const account = initialAccounts.find(
                (a) => a.id === item.account_id,
              );

              return (
                <div
                  key={item.account_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                      style={{
                        backgroundColor: `${account?.color || "#8B5CF6"}20`,
                        color: account?.color || "#8B5CF6",
                      }}
                    >
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {item.account_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Saldo: {formatCurrency(item.current_balance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold truncate ${pos ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {pos ? "+" : ""}
                        {formatCurrency(item.total_gain_loss)}
                      </p>
                      <p
                        className={`text-xs ${pos ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {pos ? "+" : ""}
                        {item.gain_loss_percentage}%
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setUpdateAccount(account || null)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Update
                    </Button>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Update History */}
      {initialLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Update Saldo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {initialLogs.map((log) => {
              const pos = log.gain_loss >= 0;
              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {log.account?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(log.old_balance)} →{" "}
                      {formatCurrency(log.new_balance)}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground italic truncate">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:text-right gap-3 w-full sm:w-auto">
                    <p
                      className={`text-sm font-bold truncate ${pos ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {pos ? "+" : ""}
                      {formatCurrency(log.gain_loss)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "d MMM yyyy", {
                        locale: id,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <UpdateBalanceDialog
        open={!!updateAccount}
        account={updateAccount}
        onClose={() => setUpdateAccount(null)}
        onUpdate={handleUpdateBalance}
      />
    </>
  );
}
