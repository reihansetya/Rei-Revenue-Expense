"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InvestmentBalanceLog } from "@/types";

export async function getAccounts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }

  return data;
}

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const balance = parseFloat(formData.get("balance") as string) || 0;
  const icon = formData.get("icon") as string || "wallet";
  const color = formData.get("color") as string || "#3B82F6";

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    balance,
    icon,
    color,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true };
}

export async function updateAccount(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const icon = formData.get("icon") as string || "wallet";
  const color = formData.get("color") as string || "#3B82F6";

  const { error } = await supabase
    .from("accounts")
    .update({ name, type, icon, color })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true };
}

export async function updateInvestmentBalance(
  accountId: string,
  newBalance: number,
  notes?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !account) return { error: "Akun tidak ditemukan" };

  const oldBalance = Number(account.balance);
  const gainLoss = newBalance - oldBalance;
  const gainLossPercentage = oldBalance > 0 ? (gainLoss / oldBalance) * 100 : 0;

  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  const { error: logError } = await supabase
    .from("investment_balance_logs")
    .insert({
      user_id: user.id,
      account_id: accountId,
      old_balance: oldBalance,
      new_balance: newBalance,
      gain_loss: gainLoss,
      gain_loss_percentage: parseFloat(gainLossPercentage.toFixed(2)),
      notes: notes || null,
    });

  if (logError) return { error: logError.message };

  revalidatePath("/accounts");
  revalidatePath("/investments");
  revalidatePath("/");
  return { success: true };
}

export async function getInvestmentLogs(accountId?: string): Promise<InvestmentBalanceLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("investment_balance_logs")
    .select(`*, account:accounts (id, name, icon, color)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query.limit(50);
  if (error) return [];
  return data || [];
}
