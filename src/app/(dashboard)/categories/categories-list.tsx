"use client";

import { useState } from "react";
import { Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Tags, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "./actions";
import { CategoryFormDialog } from "./category-form-dialog";
import { useRouter } from "next/navigation";

export function CategoriesList({ initialCategories }: { initialCategories: Category[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const router = useRouter();

  const incomeCategories = initialCategories.filter((c) => c.type === "income");
  const expenseCategories = initialCategories.filter((c) => c.type === "expense");

  async function handleCreate(formData: FormData) {
    const result = await createCategory(formData);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!editingCategory) return;
    const result = await updateCategory(editingCategory.id, formData);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setEditingCategory(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return;
    const result = await deleteCategory(id);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
  }

  function renderCategoryGroup(title: string, icon: React.ReactNode, categories: Category[]) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-semibold">{title}</h2>
          <span className="text-xs text-muted-foreground">({categories.length})</span>
        </div>
        <div className="grid gap-2">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada kategori</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Kategori
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {renderCategoryGroup(
          "Pemasukan",
          <ArrowUpCircle className="h-5 w-5 text-emerald-500" />,
          incomeCategories
        )}
        {renderCategoryGroup(
          "Pengeluaran",
          <ArrowDownCircle className="h-5 w-5 text-rose-500" />,
          expenseCategories
        )}
      </div>

      {initialCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Belum ada kategori. Tambahkan kategori pertama Anda!</p>
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        title="Tambah Kategori Baru"
      />

      {editingCategory && (
        <CategoryFormDialog
          open={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleUpdate}
          title="Edit Kategori"
          defaultValues={editingCategory}
        />
      )}
    </>
  );
}
