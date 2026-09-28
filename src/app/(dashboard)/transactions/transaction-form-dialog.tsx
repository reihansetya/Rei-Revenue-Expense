"use client";

import { useState } from "react";
import { Account, Category } from "@/types";
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
import { useCreateTransaction } from "@/queries/transactions";

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
}

// Last used account and category per type, so daily entries need fewer taps.
// Per-browser convenience only: storage can be empty or blocked, and stale IDs are ignored.
const LAST_USED_KEY = "transaction-form:last-used";
type LastUsed = { accountId?: string; categoryIds?: Record<string, string> };

function readLastUsed(): LastUsed {
  try {
    return JSON.parse(localStorage.getItem(LAST_USED_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLastUsed(value: LastUsed) {
  try {
    localStorage.setItem(LAST_USED_KEY, JSON.stringify(value));
  } catch {
    // ignore: storage unavailable
  }
}

export function TransactionFormDialog({
  open,
  onClose,
  accounts,
  categories,
}: TransactionFormDialogProps) {
  const createMutation = useCreateTransaction();
  const [selectedType, setSelectedType] = useState<string>("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => readLastUsed().categoryIds?.expense ?? "",
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    () => readLastUsed().accountId ?? "",
  );
  const [date, setDate] = useState(todayWIB);
  // Bumped after "Simpan & tambah lagi" to remount (clear) amount and note
  const [formKey, setFormKey] = useState(0);

  const filteredCategories = categories.filter((c) => c.type === selectedType);

  if (!open) return null;

  // Only IDs that still exist are used (a remembered account may have been deleted)
  const selectedCategory = filteredCategories.find(
    (c) => c.id === selectedCategoryId,
  );
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  function resetForm() {
    const lastUsed = readLastUsed();
    setSelectedType("expense");
    setSelectedCategoryId(lastUsed.categoryIds?.expense ?? "");
    setSelectedAccountId(lastUsed.accountId ?? "");
    setDate(todayWIB());
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleTypeChange(type: string) {
    setSelectedType(type);
    setSelectedCategoryId(readLastUsed().categoryIds?.[type] ?? "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const addAnother = submitter?.getAttribute("name") === "add-another";
    const formData = new FormData(e.currentTarget);

    // Clean up the formatted amount (e.g., "1.500.000" -> "1500000")
    const rawAmount = formData.get("amount") as string;
    if (rawAmount) {
      formData.set("amount", rawAmount.replace(/\./g, ""));
    }

    formData.set("type", selectedType);
    formData.set("category_id", selectedCategory?.id ?? "");
    formData.set("account_id", selectedAccount?.id ?? "");

    // Success/error toasts and cache invalidation are handled by the mutation hook
    createMutation.mutate(formData, {
      onSuccess: () => {
        const lastUsed = readLastUsed();
        saveLastUsed({
          accountId: selectedAccount?.id ?? lastUsed.accountId,
          categoryIds: {
            ...lastUsed.categoryIds,
            ...(selectedCategory && { [selectedType]: selectedCategory.id }),
          },
        });

        if (addAnother) {
          // Keep type, category, account and date; clear amount and note
          setFormKey((key) => key + 1);
        } else {
          resetForm();
          onClose();
        }
      },
    });
  }

  const isSaving = createMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background border p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Tambah Transaksi</h2>
        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedType === "expense" ? "default" : "outline"}
              className={`flex-1 ${selectedType === "expense" ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}`}
              onClick={() => handleTypeChange("expense")}
            >
              Pengeluaran
            </Button>
            <Button
              type="button"
              variant={selectedType === "income" ? "default" : "outline"}
              className={`flex-1 ${selectedType === "income" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
              onClick={() => handleTypeChange("income")}
            >
              Pemasukan
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            {/* inputMode opens the numeric keypad on phones */}
            <NumericFormat
              id="amount"
              name="amount"
              customInput={Input}
              inputMode="numeric"
              autoFocus
              thousandSeparator="."
              decimalSeparator=","
              placeholder="50.000"
              allowNegative={false}
              required
            />
          </div>

          {/* Kategori — controlled, tidak pakai name di Select */}
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={selectedCategory?.id ?? ""}
              onValueChange={(val) => setSelectedCategoryId(val || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori">
                  {selectedCategory
                    ? `${selectedCategory.icon} ${selectedCategory.name}`
                    : "Pilih kategori"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
                {filteredCategories.length === 0 && (
                  <SelectItem value="none" disabled>
                    Belum ada kategori{" "}
                    {selectedType === "income" ? "pemasukan" : "pengeluaran"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Akun — controlled, tidak pakai name di Select */}
          <div className="space-y-2">
            <Label>Dompet</Label>
            <Select
              value={selectedAccount?.id ?? ""}
              onValueChange={(val) => setSelectedAccountId(val || "")}
            >
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
                {accounts.length === 0 && (
                  <SelectItem value="none" disabled>
                    Belum ada dompet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Catatan (opsional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Makan siang, belanja, dll"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button
              type="submit"
              name="add-another"
              variant="secondary"
              disabled={isSaving}
            >
              Simpan & tambah lagi
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
