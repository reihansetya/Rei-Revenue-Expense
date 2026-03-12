"use client";

import { useState } from "react";
import { Account } from "@/types";
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

const ACCOUNT_COLORS = [
  "#3B82F6", "#10B981", "#EF4444", "#F97316", "#8B5CF6",
  "#EC4899", "#14B8A6", "#6366F1",
];

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  title: string;
  defaultValues?: Account;
}

export function AccountFormDialog({ open, onClose, onSubmit, title, defaultValues }: AccountFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(defaultValues?.color || "#3B82F6");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("color", selectedColor);
    await onSubmit(formData);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background border p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Akun</Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: BCA, GoPay, Cash"
              defaultValue={defaultValues?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe</Label>
            <Select name="type" defaultValue={defaultValues?.type || "bank"}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!defaultValues && (
            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Awal</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                placeholder="0"
                defaultValue="0"
                min="0"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-primary" : "hover:scale-110"}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
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
