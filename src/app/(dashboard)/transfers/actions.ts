"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Transfer } from "@/types";

/**
 * Mengambil semua transfer milik user yang login
 * Diurutkan berdasarkan tanggal terbaru
 */
export async function getTransfers(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<Transfer[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("transfers")
    .select(
      `
      *,
      from_account:accounts!transfers_from_account_id_fkey (
        id,
        name,
        type,
        icon,
        color
      ),
      to_account:accounts!transfers_to_account_id_fkey (
        id,
        name,
        type,
        icon,
        color
      )
    `,
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  // Filter tanggal (opsional)
  if (filters?.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error("Error fetching transfers:", error);
    return [];
  }

  return data || [];
}

/**
 * Membuat transfer baru
 * Trigger database akan otomatis update saldo kedua akun
 */
export async function createTransfer(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tidak terautentikasi" };

  // Extract form data
  const from_account_id = formData.get("from_account_id") as string;
  const to_account_id = formData.get("to_account_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const date = formData.get("date") as string;
  const description = formData.get("description") as string;

  // Validasi
  if (!from_account_id || !to_account_id) {
    return { error: "Pilih dompet sumber dan tujuan" };
  }

  if (from_account_id === to_account_id) {
    return { error: "Dompet sumber dan tujuan tidak boleh sama" };
  }

  if (!amount || amount <= 0) {
    return { error: "Jumlah harus lebih dari 0" };
  }

  if (!date) {
    return { error: "Tanggal harus diisi" };
  }

  // Cek saldo akun sumber untuk memvalidasi limit (Hanya milik user login yg dicari demi security)
  const { data: fromAccount } = await supabase
    .from("accounts")
    .select("balance, name")
    .eq("id", from_account_id)
    .eq("user_id", user.id)
    .single();

  if (fromAccount && fromAccount.balance < amount) {
    return {
      error: `Saldo dompet ${fromAccount.name} tidak mencukupi. Saldo: Rp ${fromAccount.balance.toLocaleString("id-ID")}`,
    };
  }

  // Insert transfer (trigger akan otomatis update balance)
  const { error } = await supabase.from("transfers").insert({
    user_id: user.id,
    from_account_id,
    to_account_id,
    amount,
    date,
    description: description || null,
    source: "web",
  });

  if (error) {
    console.error("Error creating transfer:", error);
    return { error: error.message };
  }

  revalidatePath("/transfers");
  revalidatePath("/");
  revalidatePath("/accounts");
  return { success: true };
}

/**
 * Menghapus transfer
 * Perlu manual reverse balance karena tidak ada trigger untuk DELETE
 */
export async function deleteTransfer(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tidak terautentikasi" };

  // Ambil data transfer sebelum dihapus
  const { data: transfer, error: fetchError } = await supabase
    .from("transfers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !transfer) {
    return { error: "Transfer tidak ditemukan" };
  }

  // Reverse balance menggunakan RPC function
  const { error: rpcError } = await supabase.rpc("reverse_transfer_balance", {
    p_from_account_id: transfer.from_account_id,
    p_to_account_id: transfer.to_account_id,
    p_amount: transfer.amount,
  });

  if (rpcError) {
    console.error("Error reversing balance:", rpcError);
    // Tetap lanjutkan hapus meski reverse gagal (sesuai dokumen)
  }

  // Hapus record transfer
  const { error } = await supabase
    .from("transfers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transfers");
  revalidatePath("/");
  revalidatePath("/accounts");
  return { success: true };
}
