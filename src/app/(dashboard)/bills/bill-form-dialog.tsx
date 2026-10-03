"use client";

import { useState } from "react";
import { Account, Bill, BillIntervalUnit, Category } from "@/types";
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

const UNIT_OPTIONS: { value: BillIntervalUnit; label: string }[] = [
  { value: "week", label: "Minggu" },
  { value: "month", label: "Bulan" },
  { value: "year", label: "Tahun" },
];

interface BillFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  title: string;
  defaultValues?: Bill;
  accounts: Account[];
  categories: Category[];
}

export function BillFormDialog({
  open,
  onClose,
  onSubmit,
  title,
  defaultValues,
  accounts,
  categories,
}: BillFormDialogProps) {
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const [loading, setLoading] = useState(false);
  // New bills default to the "Tagihan" category when the user has one
  const [categoryId, setCategoryId] = useState(
    () =>
      defaultValues?.category_id ??
      expenseCategories.find((c) => c.name.toLowerCase() === "tagihan")?.id ??
      "",
  );
  const [accountId, setAccountId] = useState(
    () => defaultValues?.account_id ?? accounts.find((a) => a.is_default)?.id ?? "",
  );
  const [intervalUnit, setIntervalUnit] = useState<BillIntervalUnit>(
    defaultValues?.interval_unit ?? "month",
  );

  if (!open) return null;

  const selectedCategory = expenseCategories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    // Clean up the formatted amount (e.g., "1.500.000" -> "1500000")
    const rawAmount = formData.get("amount") as string | null;
    if (rawAmount) {
      formData.set("amount", rawAmount.replace(/\./g, ""));
    }
    formData.set("category_id", selectedCategory?.id ?? "");
    formData.set("account_id", selectedAccount?.id ?? "");
    formData.set("interval_unit", intervalUnit);
    await onSubmit(formData);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background border p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Tagihan</Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Kontrakan, Listrik"
              defaultValue={defaultValues?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <NumericFormat
              id="amount"
              name="amount"
              customInput={Input}
              inputMode="numeric"
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={0}
              placeholder="1.500.000"
              allowNegative={false}
              defaultValue={defaultValues?.amount}
              required
            />
            <p className="text-xs text-muted-foreground">
              Untuk tagihan yang berubah-ubah (mis. listrik), isi perkiraan. Nominal bisa diubah saat bayar.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ulangi setiap</Label>
            <div className="flex gap-2">
              <Input
                name="interval_count"
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={defaultValues?.interval_count ?? 1}
                className="w-20"
                required
              />
              <Select
                value={intervalUnit}
                onValueChange={(val) => val && setIntervalUnit(val as BillIntervalUnit)}
              >
                <SelectTrigger className="flex-1">
                  {/* Base UI shows the raw value ("month") unless the label is given */}
                  <SelectValue>
                    {UNIT_OPTIONS.find((u) => u.value === intervalUnit)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_due_date">Jatuh tempo berikutnya</Label>
            <Input
              id="next_due_date"
              name="next_due_date"
              type="date"
              defaultValue={defaultValues?.next_due_date ?? todayWIB()}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori">
                  {selectedCategory
                    ? `${selectedCategory.icon} ${selectedCategory.name}`
                    : "Pilih kategori"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bayar dari dompet</Label>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
