"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  Plus,
  Wallet,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { createTransfer } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account } from "@/types";
import { NumericFormat } from "react-number-format";

interface TransferFormDialogProps {
  accounts: Account[];
}

// Icon mapping
const accountIcons = {
  bank: CreditCard,
  ewallet: Wallet,
  cash: Banknote,
  investment: TrendingUp,
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function TransferFormDialog({ accounts }: TransferFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");

  // Filter akun tujuan (tidak boleh sama dengan akun sumber)
  const filteredToAccounts = accounts.filter((acc) => acc.id !== fromAccountId);
  const filteredFromAccounts = accounts.filter((acc) => acc.id !== toAccountId);

  // Get selected account details
  const fromAccount = accounts.find((acc) => acc.id === fromAccountId);
  const toAccount = accounts.find((acc) => acc.id === toAccountId);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await createTransfer(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setOpen(false);
      setIsLoading(false);
      // Reset form
      setFromAccountId("");
      setToAccountId("");
    }
  }

  // Default date: hari ini
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="bg-blue-600 hover:bg-blue-700 text-white" />}
      >
        <Plus className="h-4 w-4 mr-2" />
        Transfer Baru
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Antar Dompet
          </DialogTitle>
          <DialogDescription>
            Pindahkan saldo dari satu dompet ke dompet lainnya
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 mt-4">
          {/* From Account */}
          <div className="space-y-2">
            <Label htmlFor="from_account_id">Dari Dompet</Label>
            <Select
              name="from_account_id"
              value={fromAccountId}
              onValueChange={(val) => setFromAccountId(val || "")}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih dompet sumber">
                  {fromAccount ? (
                    <span className="flex items-center gap-2">
                      {fromAccount.name}
                    </span>
                  ) : (
                    "Pilih dompet sumber"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredFromAccounts.map((account) => {
                  const Icon = accountIcons[account.type] || accountIcons.bank;
                  return (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4"
                          style={{ color: account.color }}
                        />
                        <span>{account.name}</span>
                        <span className="text-gray-500 ml-auto text-xs hidden sm:inline">
                          ({formatCurrency(account.balance)})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {fromAccount && (
              <p className="text-xs text-gray-500 font-medium">
                Saldo tersedia: {formatCurrency(fromAccount.balance)}
              </p>
            )}
          </div>

          {/* To Account */}
          <div className="space-y-2">
            <Label htmlFor="to_account_id">Ke Dompet</Label>
            <Select
              name="to_account_id"
              value={toAccountId}
              onValueChange={(val) => setToAccountId(val || "")}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih dompet tujuan">
                  {toAccount ? (
                    <span className="flex items-center gap-2">
                      {toAccount.name}
                    </span>
                  ) : (
                    "Pilih dompet tujuan"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredToAccounts.map((account) => {
                  const Icon = accountIcons[account.type] || accountIcons.bank;
                  return (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4"
                          style={{ color: account.color }}
                        />
                        <span>{account.name}</span>
                        <span className="text-gray-500 ml-auto hidden sm:inline text-xs">
                          ({formatCurrency(account.balance)})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Type Preview */}
          {fromAccountId && toAccountId && (() => {
            const isInvestBuy = fromAccount?.type !== "investment" && toAccount?.type === "investment";
            const isInvestSell = fromAccount?.type === "investment" && toAccount?.type !== "investment";
            if (!isInvestBuy && !isInvestSell) return null;
            return (
              <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${isInvestBuy ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"}`}>
                {isInvestBuy ? <TrendingUp className="h-4 w-4 shrink-0" /> : <TrendingDown className="h-4 w-4 shrink-0" />}
                <span className="font-medium">{isInvestBuy ? "Pembelian Investasi" : "Pencairan Investasi"}</span>
                <Info className="h-3.5 w-3.5 opacity-60 ml-auto shrink-0" />
              </div>
            );
          })()}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-white-500 font-medium whitespace-nowrap">
                Rp
              </span>
              <NumericFormat
                name="amount"
                className="pl-9"
                placeholder="0"
                min="1"
                step="1"
                required
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input type="date" name="date" defaultValue={today} required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Catatan (opsional)</Label>
            <Input
              type="text"
              name="description"
              placeholder="Contoh: Tarik tunai ATM, Topup Gopay..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !fromAccountId || !toAccountId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Menyimpan..." : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
