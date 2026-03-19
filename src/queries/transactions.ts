import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTransactions, createTransaction, deleteTransaction } from "@/app/(dashboard)/transactions/actions";
import { FilterState } from "@/app/(dashboard)/transactions/filter-bar";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TransactionWithRelations {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  source: string;
  created_at: string;
  accounts: { name: string } | null;
  categories: { name: string; icon: string; color: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getDateRange(period: string, customStart?: string, customEnd?: string) {
  const now = new Date();

  if (period === "current") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") };
  }

  if (period === "last") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") };
  }

  if (period === "custom" && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  if (period.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = period.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") };
  }

  return { startDate: undefined, endDate: undefined };
}

export function filtersToQueryParams(filters: FilterState) {
  const { startDate, endDate } = getDateRange(
    filters.period,
    filters.customStartDate,
    filters.customEndDate
  );
  return {
    type: filters.type,
    search: filters.search || undefined,
    startDate,
    endDate,
    categoryId: filters.categoryIds,
    accountId: filters.accountIds,
  };
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const transactionKeys = {
  all: ["transactions"] as const,
  filtered: (filters: FilterState) => ["transactions", filters] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTransactions(filters: FilterState) {
  return useQuery({
    queryKey: transactionKeys.filtered(filters),
    queryFn: async () => {
      const params = filtersToQueryParams(filters);
      const data = await getTransactions(params);
      return data as TransactionWithRelations[];
    },
    staleTime: 60 * 1000, // 1 menit
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createTransaction(formData);
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Transaksi berhasil ditambahkan", { duration: 1500 });
      // Invalidate semua query transactions agar re-fetch
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menambahkan transaksi", { closeButton: true });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTransaction(id);
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async (id: string) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      // Snapshot semua cached transaction queries untuk rollback
      const previousQueries = queryClient.getQueriesData<TransactionWithRelations[]>({
        queryKey: transactionKeys.all,
      });

      // Optimistic update: hapus dari semua cached queries
      queryClient.setQueriesData<TransactionWithRelations[]>(
        { queryKey: transactionKeys.all },
        (old) => old?.filter((t) => t.id !== id) ?? []
      );

      return { previousQueries };
    },
    onError: (_err, _id, context) => {
      // Rollback semua queries ke state sebelumnya
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Gagal menghapus transaksi", { closeButton: true });
    },
    onSuccess: () => {
      toast.success("Transaksi berhasil dihapus", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
