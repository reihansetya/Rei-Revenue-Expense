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

  const filteredCategories = categories.filter((c) => c.type === selectedType);
  const today = new Date().toISOString().split("T")[0];

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("type", selectedType);
    await onSubmit(formData);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background border p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Tambah Transaksi</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedType === "expense" ? "default" : "outline"}
              className={`flex-1 ${selectedType === "expense" ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}`}
              onClick={() => setSelectedType("expense")}
            >
              Pengeluaran
            </Button>
            <Button
              type="button"
              variant={selectedType === "income" ? "default" : "outline"}
              className={`flex-1 ${selectedType === "income" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
              onClick={() => setSelectedType("income")}
            >
              Pemasukan
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="50000"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Kategori</Label>
            <Select name="category_id">
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
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

          <div className="space-y-2">
            <Label htmlFor="account_id">Akun</Label>
            <Select name="account_id">
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
                {accounts.length === 0 && (
                  <SelectItem value="none" disabled>
                    Belum ada akun
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
