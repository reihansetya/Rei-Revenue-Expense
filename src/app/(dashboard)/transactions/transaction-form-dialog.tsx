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

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  accounts: Account[];
  categories: Category[];
}

export function TransactionFormDialog({
  open,
  onClose,
  onSubmit,
  accounts,
  categories,
}: TransactionFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const filteredCategories = categories.filter((c) => c.type === selectedType);
  const today = new Date().toISOString().split("T")[0];

  if (!open) return null;

  function handleClose() {
    setSelectedCategoryId("");
    setSelectedAccountId("");
    setSelectedType("expense");
    onClose();
  }

  function handleTypeChange(type: string) {
    setSelectedType(type);
    setSelectedCategoryId(""); // reset kategori saat ganti tipe
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    // Clean up the formatted amount (e.g., "1.500.000" -> "1500000")
    const rawAmount = formData.get("amount") as string;
    if (rawAmount) {
      formData.set("amount", rawAmount.replace(/\./g, ""));
    }

    formData.set("type", selectedType);
    formData.set("category_id", selectedCategoryId);
    formData.set("account_id", selectedAccountId);

    await onSubmit(formData);
    setLoading(false);
  }

  const selectedCategory = filteredCategories.find((c) => c.id === selectedCategoryId);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background border p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Tambah Transaksi</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <NumericFormat
              id="amount"
              name="amount"
              customInput={Input}
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
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
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
                    Belum ada kategori {selectedType === "income" ? "pemasukan" : "pengeluaran"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Akun — controlled, tidak pakai name di Select */}
          <div className="space-y-2">
            <Label>Dompet</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
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
              defaultValue={today}
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
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