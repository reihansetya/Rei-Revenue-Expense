"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Scale, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericFormat } from "react-number-format";
import type { Account } from "@/types";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const getTodayLabel = () => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

interface UpdateWalletBalanceDialogProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onUpdate: (accountId: string, newBalance: number, notes: string) => Promise<void>;
}

export function UpdateWalletBalanceDialog({
  open,
  account,
  onClose,
  onUpdate,
}: UpdateWalletBalanceDialogProps) {
  const [newBalanceRaw, setNewBalanceRaw] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !account) return null;

  const currentBalance = Number(account.balance);
  const newBalanceNum = parseFloat(newBalanceRaw.replace(/\./g, "").replace(",", ".")) || 0;
  const difference = newBalanceNum - currentBalance;

  const getChangeInfo = () => {
    if (difference === 0 || !newBalanceRaw) {
      return {
        icon: Minus,
        color: "text-gray-500",
        label: "Tidak ada perubahan",
        bg: "bg-gray-50 dark:bg-gray-800/50",
        border: "border-gray-200 dark:border-gray-700",
        txLabel: null,
        txColor: "",
      };
    }
    if (difference > 0) {
      return {
        icon: TrendingUp,
        color: "text-emerald-600 dark:text-emerald-400",
        label: "Saldo Naik",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        txLabel: `Pemasukan ${formatCurrency(difference)}`,
        txColor: "text-emerald-600 dark:text-emerald-400",
      };
    }
    return {
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      label: "Saldo Turun",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      txLabel: `Pengeluaran ${formatCurrency(Math.abs(difference))}`,
      txColor: "text-red-600 dark:text-red-400",
    };
  };

  const { icon: Icon, color, label, bg, border, txLabel, txColor } = getChangeInfo();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newBalanceRaw) return;
    setLoading(true);
    await onUpdate(account!.id, newBalanceNum, notes);
    setLoading(false);
    setNewBalanceRaw("");
    setNotes("");
    onClose();
  }

  function handleClose() {
    setNewBalanceRaw("");
    setNotes("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-50 w-full max-w-md rounded-xl bg-background border shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">Koreksi Saldo</h2>
            <p className="text-sm text-muted-foreground">{account.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Saldo Saat Ini */}
          <div className="rounded-lg bg-muted/60 p-4">
            <p className="text-xs text-muted-foreground mb-1">Saldo Saat Ini</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(currentBalance)}</p>
          </div>

          {/* Input Saldo Baru */}
          <div className="space-y-1.5">
            <Label htmlFor="newBalanceWallet">Saldo Aktual Sekarang</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted-foreground font-medium text-sm">Rp</span>
              <NumericFormat
                id="newBalanceWallet"
                customInput={Input}
                className="pl-9"
                placeholder="0"
                thousandSeparator="."
                decimalSeparator=","
                allowNegative={false}
                value={newBalanceRaw}
                onValueChange={(values) => setNewBalanceRaw(values.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Preview Perubahan */}
          {newBalanceRaw && (
            <div className={`rounded-lg border p-4 ${bg} ${border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className={`text-sm font-semibold ${color}`}>{label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Selisih</p>
                  <p className={`font-bold tabular-nums ${color}`}>
                    {difference >= 0 ? "+" : ""}
                    {formatCurrency(difference)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Saldo Baru</p>
                  <p className="font-bold tabular-nums">{formatCurrency(newBalanceNum)}</p>
                </div>
              </div>
              {txLabel && difference !== 0 && (
                <div className="mt-3 pt-3 border-t border-inherit">
                  <p className="text-xs text-muted-foreground mb-1">Transaksi yang akan dibuat:</p>
                  <p className={`text-sm font-semibold ${txColor}`}>📋 {txLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Kategori: Balancing</p>
                </div>
              )}
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="walletNotes">Catatan (Opsional)</Label>
            <Input
              id="walletNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Bayar kos, makan, dll."
            />
          </div>

          {/* Info tanggal otomatis */}
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
            <CalendarDays className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Transaksi akan dicatat hari ini: <span className="font-medium">{getTodayLabel()}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!newBalanceRaw || loading || difference === 0}
            >
              {loading ? "Menyimpan..." : "Simpan Koreksi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
