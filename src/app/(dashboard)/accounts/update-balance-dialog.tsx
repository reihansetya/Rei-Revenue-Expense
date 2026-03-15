"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface UpdateBalanceDialogProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onUpdate: (accountId: string, newBalance: number, notes: string) => Promise<void>;
}

export function UpdateBalanceDialog({
  open,
  account,
  onClose,
  onUpdate,
}: UpdateBalanceDialogProps) {
  const [newBalanceRaw, setNewBalanceRaw] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !account) return null;

  const currentBalance = Number(account.balance);
  const newBalanceNum = parseFloat(newBalanceRaw.replace(/\./g, "")) || 0;
  const difference = newBalanceNum - currentBalance;
  const percentage =
    currentBalance > 0 ? ((difference / currentBalance) * 100).toFixed(2) : "0";

  const getGainLoss = () => {
    if (difference === 0) return { icon: Minus, color: "text-gray-500", label: "Tidak ada perubahan", bg: "bg-gray-50 dark:bg-gray-800" };
    if (difference > 0) return { icon: TrendingUp, color: "text-emerald-600", label: "Gain", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
    return { icon: TrendingDown, color: "text-red-600", label: "Loss", bg: "bg-red-50 dark:bg-red-900/20" };
  };

  const { icon: Icon, color, label, bg } = getGainLoss();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newBalanceNum) return;
    setLoading(true);
    await onUpdate(account!.id, newBalanceNum, notes);
    setLoading(false);
    setNewBalanceRaw("");
    setNotes("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background border p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Update Saldo Investasi</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Balance */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo Saat Ini — {account.name}</p>
            <p className="text-xl font-bold">{formatCurrency(currentBalance)}</p>
          </div>

          {/* New Balance Input */}
          <div className="space-y-2">
            <Label htmlFor="newBalance">Saldo Baru</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted-foreground font-medium">Rp</span>
              <NumericFormat
                id="newBalance"
                customInput={Input}
                className="pl-9"
                placeholder="0"
                thousandSeparator="."
                decimalSeparator=","
                allowNegative={false}
                value={newBalanceRaw}
                onValueChange={(values) => setNewBalanceRaw(values.value)}
                required
              />
            </div>
          </div>

          {/* Gain/Loss Preview */}
          {newBalanceRaw && (
            <div className={`p-4 rounded-lg ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className={`font-medium ${color}`}>{label}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Selisih</p>
                  <p className={`font-bold ${color}`}>
                    {difference >= 0 ? "+" : ""}
                    {formatCurrency(difference)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Persentase</p>
                  <p className={`font-bold ${color}`}>
                    {difference >= 0 ? "+" : ""}{percentage}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Saham naik Q4 2024"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={!newBalanceRaw || loading}>
              {loading ? "Menyimpan..." : "Update Saldo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
