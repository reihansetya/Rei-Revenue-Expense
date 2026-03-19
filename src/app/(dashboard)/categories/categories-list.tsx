"use client";

import { useState } from "react";
import { Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Tags,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { CategoryFormDialog } from "./category-form-dialog";
import { toast } from "sonner";
import {
  useCategories,
  useDeleteCategory,
  useCreateCategory,
  useUpdateCategory,
} from "@/queries/categories";

export function CategoriesList({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // TanStack Query — gunakan initialCategories sebagai seed data
  const { data: categories = initialCategories } = useCategories();
  const deleteMutation = useDeleteCategory();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  async function handleCreate(formData: FormData) {
    return new Promise<void>((resolve) => {
      createCategoryMutation.mutate(formData, {
        onSuccess: () => {
          setDialogOpen(false);
          resolve();
        },
        onError: (error) => {
          toast.error(error.message || "Gagal menambahkan kategori", {
            closeButton: true,
          });
          resolve();
        },
      });
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editingCategory) return;

    return new Promise<void>((resolve) => {
      updateCategoryMutation.mutate(
        { id: editingCategory.id!, formData },
        {
          onSuccess: () => {
            setEditingCategory(null);
            resolve();
          },
          onError: (error) => {
            toast.error(error.message || "Gagal mengupdate kategori", {
              closeButton: true,
            });
            resolve();
          },
        },
      );
    });
  }

  function handleDelete(id: string) {
    toast("Hapus kategori ini?", {
      action: {
        label: "Hapus",
        onClick: () => {
          deleteMutation.mutate(id);
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  }

  function renderCategoryGroup(
    title: string,
    icon: React.ReactNode,
    categoryList: Category[],
  ) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-semibold">{title}</h2>
          <span className="text-xs text-muted-foreground">
            ({categoryList.length})
          </span>
        </div>
        <div className="grid gap-2">
          {categoryList.map((category) => (
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
                    onClick={() => handleDelete(category.id ?? "")}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {categoryList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada kategori
            </p>
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
          incomeCategories,
        )}
        {renderCategoryGroup(
          "Pengeluaran",
          <ArrowDownCircle className="h-5 w-5 text-rose-500" />,
          expenseCategories,
        )}
      </div>

      {categories.length === 0 && (
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
