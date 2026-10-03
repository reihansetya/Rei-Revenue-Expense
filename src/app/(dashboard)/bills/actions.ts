"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { todayWIB } from "@/lib/utils";
import { payBill } from "@/lib/bills";
import { sendTelegramMessage } from "@/lib/telegram/utils";
import type { Bill } from "@/types";

function revalidateAll() {
  revalidatePath("/bills");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function getBills(): Promise<Bill[]> {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) return [];

  // Embedded payments are filtered to this month only (paid summary / "Lunas" badge)
  const monthStart = `${todayWIB().slice(0, 7)}-01`;
  const { data, error } = await supabase
    .from("bills")
    .select("*, categories(name, icon), bill_payments(due_date, transactions(amount))")
    .eq("user_id", user.id)
    .gte("bill_payments.due_date", monthStart)
    .order("next_due_date", { ascending: true });

  if (error) {
    console.error("Error fetching bills:", error);
    return [];
  }

  return data as Bill[];
}

function readBillForm(formData: FormData) {
  const intervalUnit = formData.get("interval_unit") as string;
  return {
    name: (formData.get("name") as string)?.trim(),
    amount: Number(formData.get("amount")),
    category_id: (formData.get("category_id") as string) || null,
    account_id: (formData.get("account_id") as string) || null,
    interval_unit: ["week", "month", "year"].includes(intervalUnit) ? intervalUnit : "month",
    interval_count: Math.max(1, Math.floor(Number(formData.get("interval_count")) || 1)),
    next_due_date: formData.get("next_due_date") as string,
  };
}

function validateBill(bill: ReturnType<typeof readBillForm>) {
  if (!bill.name) return "Nama tagihan wajib diisi";
  if (!(bill.amount > 0)) return "Jumlah harus lebih dari 0";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bill.next_due_date ?? "")) return "Tanggal jatuh tempo wajib diisi";
  return null;
}

export async function createBill(formData: FormData) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) return { error: "Not authenticated" };

  const bill = readBillForm(formData);
  const invalid = validateBill(bill);
  if (invalid) return { error: invalid };

  const { error } = await supabase.from("bills").insert({
    ...bill,
    user_id: user.id,
    start_date: bill.next_due_date,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function updateBill(id: string, formData: FormData) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) return { error: "Not authenticated" };

  const bill = readBillForm(formData);
  const invalid = validateBill(bill);
  if (invalid) return { error: invalid };

  const { data: current } = await supabase
    .from("bills")
    .select("next_due_date, interval_unit, interval_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!current) return { error: "Tagihan tidak ditemukan" };

  // Re-anchor only when the schedule changes; editing the name/amount of a bill on the
  // 31st must not move its anchor to the clamped 28th
  const scheduleChanged =
    current.next_due_date !== bill.next_due_date ||
    current.interval_unit !== bill.interval_unit ||
    current.interval_count !== bill.interval_count;

  const { error } = await supabase
    .from("bills")
    .update({ ...bill, ...(scheduleChanged && { start_date: bill.next_due_date }) })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteBill(id: string) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) return { error: "Not authenticated" };

  // Past payment transactions stay; only the bill and its payment links are removed
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function payBillAction(
  billId: string,
  input: { dueDate: string; skip?: boolean; amount?: number; accountId?: string; date?: string },
) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) return { error: "Not authenticated" };

  const result = await payBill(supabase, user.id, { billId, ...input, source: "web" });
  if ("error" in result) return { error: result.error };

  // Same as createTransaction: budget alert to Telegram after the response, best-effort
  if (result.alert) {
    const alert = result.alert;
    after(async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("telegram_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.telegram_id) await sendTelegramMessage(profile.telegram_id, alert);
      } catch (err) {
        console.error("Budget alert failed:", err);
      }
    });
  }

  revalidateAll();
  return { success: true, nextDue: result.nextDue };
}
