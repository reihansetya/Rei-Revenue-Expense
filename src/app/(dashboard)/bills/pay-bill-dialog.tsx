"use client";

import { useState } from "react";
import { Account, Bill } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { NumericFormat } from "react-number-format";
import { todayWIB } from "@/lib/utils";
import { formatDueDate } from "@/lib/bills";
import { usePayBill } from "@/queries/bills";

interface PayBillDialogProps {
  bill: Bill;
  accounts: Account[];
  onClose: () => void;
}

export function PayBillDialog({ bill, accounts, onClose }: PayBillDialogProps) {
  const payMutation = usePayBill();
  const [accountId, setAccountId] = useState(
    () => bill.account_id ?? accounts.find((a) => a.is_default)?.id ?? "",
  );
  const selectedAccount = accounts.find((a) => a.id === accountId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    payMutation.mutate(
      {
        id: bill.id,
        dueDate: bill.next_due_date,
        // "1.500.000" -> 1500000
        amount: Number((formData.get("amount") as string).replace(/\./g, "")),
        accountId: selectedAccount?.id,
        date: formData.get("date") as string,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background border p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Bayar {bill.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Periode jatuh tempo {formatDueDate(bill.next_due_date)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Jumlah (Rp)</Label>
            <NumericFormat
              id="pay-amount"
              name="amount"
              customInput={Input}
              inputMode="numeric"
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={0}
              allowNegative={false}
              defaultValue={Number(bill.amount)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Dompet</Label>
            <Select value={accountId} onValueChange={(val) => setAccountId(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih dompet">
                  {selectedAccount ? selectedAccount.name : "Pilih dompet"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-date">Tanggal bayar</Label>
            <Input id="pay-date" name="date" type="date" defaultValue={todayWIB()} required />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={payMutation.isPending || !selectedAccount}>
              {payMutation.isPending ? "Menyimpan..." : "Bayar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
