"use client";

import { useState } from "react";
import { Category } from "@/types";
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

const CATEGORY_ICONS = [
  "🍔",
  "🚗",
  "🛒",
  "🎬",
  "📱",
  "💊",
  "📚",
  "📊",
  "📦",
  "💰",
  "💻",
  "📈",
  "🎁",
  "💵",
  "🏠",
  "✈️",
  "🎮",
  "🐼",
];

const CATEGORY_COLORS = [
  "#EF4444",
  "#F97316",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
  "#14B8A6",
  "#3B82F6",
  "#10B981",
  "#6B7280",
];

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  title: string;
  defaultValues?: Category;
}

export function CategoryFormDialog({
  open,
  onClose,
  onSubmit,
  title,
  defaultValues,
}: CategoryFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(defaultValues?.icon || "📦");
  const [selectedColor, setSelectedColor] = useState(
    defaultValues?.color || "#3B82F6",
  );
  const [selectedType, setSelectedType] = useState(defaultValues?.type || "expense");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("icon", selectedIcon);
    formData.set("color", selectedColor);
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
            <Label htmlFor="name">Nama Kategori</Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Makan, Transport"
              defaultValue={defaultValues?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe</Label>
            <Select name="type" defaultValue={selectedType} onValueChange={(value) => value && setSelectedType(value as "income" | "expense")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedType === "expense" && (
            <div className="space-y-2">
              <Label htmlFor="budget">Anggaran Bulanan (Opsional)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="Contoh: 1500000"
                defaultValue={defaultValues?.budget}
              />
              <p className="text-xs text-muted-foreground">Isi untuk memantau batas pengeluaran kategori ini per bulan.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_ICONS.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-all ${selectedIcon === icon ? "ring-2 ring-primary bg-muted" : "hover:bg-muted"}`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map((color) => (
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
