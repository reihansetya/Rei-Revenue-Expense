import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/(dashboard)/categories/actions";
import { Category } from "@/types";
import { toast } from "sonner";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const categoryKeys = {
  all: ["categories"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => {
      const data = await getCategories();
      return data as Category[];
    },
    staleTime: 30 * 60 * 1000, // 30 menit (kategori jarang berubah)
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createCategory(formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Kategori berhasil ditambahkan", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menambahkan kategori");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const result = await updateCategory(id, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Kategori berhasil diupdate", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengupdate kategori");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategory(id);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all });

      const previousCategories = queryClient.getQueryData<Category[]>(categoryKeys.all);

      // Optimistic delete
      queryClient.setQueryData<Category[]>(categoryKeys.all, (old) =>
        old?.filter((c) => c.id !== id) ?? []
      );

      return { previousCategories };
    },
    onError: (_err, _id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(categoryKeys.all, context.previousCategories);
      }
      toast.error("Gagal menghapus kategori");
    },
    onSuccess: () => {
      toast.success("Kategori berhasil dihapus", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
