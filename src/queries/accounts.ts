import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  updateInvestmentBalance,
  updateWalletBalance,
} from "@/app/(dashboard)/accounts/actions";
import { Account } from "@/types";
import { toast } from "sonner";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const accountKeys = {
  all: ["accounts"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: async () => {
      const data = await getAccounts();
      return data as Account[];
    },
    staleTime: 5 * 60 * 1000, // 5 menit
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createAccount(formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Dompet berhasil ditambahkan", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menambahkan dompet");
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const result = await updateAccount(id, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Dompet berhasil diupdate", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengupdate dompet");
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAccount(id);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.all });

      const previousAccounts = queryClient.getQueryData<Account[]>(accountKeys.all);

      // Optimistic delete
      queryClient.setQueryData<Account[]>(accountKeys.all, (old) =>
        old?.filter((a) => a.id !== id) ?? []
      );

      return { previousAccounts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(accountKeys.all, context.previousAccounts);
      }
      toast.error("Gagal menghapus dompet");
    },
    onSuccess: () => {
      toast.success("Dompet berhasil dihapus", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateInvestmentBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      newBalance,
      notes,
    }: {
      accountId: string;
      newBalance: number;
      notes?: string;
    }) => {
      const result = await updateInvestmentBalance(accountId, newBalance, notes);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Saldo investasi berhasil diupdate", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengupdate saldo investasi");
    },
  });
}

export function useUpdateWalletBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      newBalance,
      notes,
    }: {
      accountId: string;
      newBalance: number;
      notes?: string;
    }) => {
      const result = await updateWalletBalance(accountId, newBalance, notes);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      if (data && 'noChange' in data && data.noChange) {
        toast.info("Saldo tidak berubah", { duration: 1500 });
        return;
      }
      toast.success("Saldo berhasil diperbarui", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui saldo dompet");
    },
  });
}
