import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  payBillAction,
} from "@/app/(dashboard)/bills/actions";
import { accountKeys } from "@/queries/accounts";
import { transactionKeys } from "@/queries/transactions";
import { Bill } from "@/types";
import { toast } from "sonner";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const billKeys = {
  all: ["bills"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useBills(initialData?: Bill[]) {
  return useQuery({
    queryKey: billKeys.all,
    queryFn: () => getBills(),
    initialData,
    staleTime: 5 * 60 * 1000, // 5 menit
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createBill(formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Tagihan berhasil ditambahkan", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menambahkan tagihan", { closeButton: true });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const result = await updateBill(id, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Tagihan berhasil diupdate", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengupdate tagihan", { closeButton: true });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBill(id);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Tagihan berhasil dihapus", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus tagihan", { closeButton: true });
    },
  });
}

/** Pay (creates an expense transaction) or skip the bill's current period. */
export function usePayBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Parameters<typeof payBillAction>[1] & { id: string }) => {
      const result = await payBillAction(id, input);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_result, { skip }) => {
      toast.success(skip ? "Periode dilewati" : "Tagihan dibayar", { duration: 1500 });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all }); // saldo akun berubah
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membayar tagihan", { closeButton: true });
    },
  });
}
