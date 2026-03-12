"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTransactions(filters?: {
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("transactions")
    .select("*, accounts(name), categories(name, icon, color)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters?.search) {
    query = query.ilike("description", `%${filters.search}%`);
  }

  if (filters?.startDate) {
    query = query.gte("date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data;
}

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const type = formData.get("type") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const account_id = formData.get("account_id") as string;
  const category_id = formData.get("category_id") as string;

  if (!amount || amount <= 0) {
    return { error: "Jumlah harus lebih dari 0" };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    description: description || null,
    date,
    account_id: account_id || null,
    category_id: category_id || null,
    source: "web",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Get transaction first to reverse balance
  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!transaction) return { error: "Transaction not found" };

  // Reverse the balance change
  if (transaction.account_id) {
    if (transaction.type === "expense") {
      await supabase.rpc("increment_balance", {
        account_id: transaction.account_id,
        amount: transaction.amount,
      });
    } else if (transaction.type === "income") {
      await supabase.rpc("increment_balance", {
        account_id: transaction.account_id,
        amount: -transaction.amount,
      });
    }
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
}
