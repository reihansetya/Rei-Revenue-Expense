"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
