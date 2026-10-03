import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  format,
  parseISO,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Bill, BillIntervalUnit } from "@/types";
import { getBudgetAlert } from "./budget-alert";
import { formatRupiah } from "./telegram/utils";
import { todayWIB } from "./utils";

// Dates are plain YYYY-MM-DD strings (WIB calendar). parseISO/format both work in local
// time, so the round trip is stable on the server (UTC) and in the browser (WIB).
type Schedule = Pick<Bill, "start_date" | "interval_unit" | "interval_count">;

const ADD = { week: addWeeks, month: addMonths, year: addYears };
const DIFF = {
  week: (a: Date, b: Date) => Math.floor(differenceInCalendarDays(a, b) / 7),
  month: differenceInCalendarMonths,
  year: differenceInCalendarYears,
};

/** k-th due date counted from the anchor (date-fns clamps to month end: 31 Jan + 1 month = 28 Feb). */
export function dueDateAt(bill: Schedule, k: number): string {
  const date = ADD[bill.interval_unit](parseISO(bill.start_date), k * bill.interval_count);
  return format(date, "yyyy-MM-dd");
}

/** First due date after `dueDate` that is not already settled. */
export function nextDueAfter(bill: Schedule, dueDate: string, settled: Set<string> = new Set()): string {
  const steps = DIFF[bill.interval_unit](parseISO(dueDate), parseISO(bill.start_date));
  let k = Math.floor(steps / bill.interval_count);
  let next: string;
  do {
    k++;
    next = dueDateAt(bill, k);
  } while (next <= dueDate || settled.has(next));
  return next;
}

export function daysUntil(date: string, today: string = todayWIB()): number {
  return differenceInCalendarDays(parseISO(date), parseISO(today));
}

export function dueLabel(days: number): string {
  if (days < 0) return `Telat ${-days} hari`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

const UNIT_LABEL: Record<BillIntervalUnit, [string, string]> = {
  week: ["Mingguan", "minggu"],
  month: ["Bulanan", "bulan"],
  year: ["Tahunan", "tahun"],
};

export function intervalLabel(unit: BillIntervalUnit, count: number): string {
  return count === 1 ? UNIT_LABEL[unit][0] : `Tiap ${count} ${UNIT_LABEL[unit][1]}`;
}

/** Total still to pay for all periods due on or before `until` (overdue ones included). */
export function unpaidUntil(bill: Bill, until: string): number {
  let total = 0;
  for (let due = bill.next_due_date; due <= until; due = nextDueAfter(bill, due)) {
    total += Number(bill.amount);
  }
  return total;
}

/**
 * Settle the bill's current period: creates the expense transaction (unless skipping),
 * records the payment and moves next_due_date forward, all inside the pay_bill RPC.
 * Shared by the web action and the Telegram bot. amount/accountId default to the bill's own.
 */
export async function payBill(
  supabase: SupabaseClient,
  userId: string,
  params: {
    billId: string;
    dueDate: string;
    skip?: boolean;
    amount?: number;
    accountId?: string | null;
    date?: string;
    source: "web" | "telegram";
  },
): Promise<{ error: string } | { bill: Bill; amount: number | null; accountName: string | null; nextDue: string; alert: string | null }> {
  const { data: bill } = await supabase
    .from("bills")
    .select("*")
    .eq("id", params.billId)
    .eq("user_id", userId)
    .maybeSingle<Bill>();

  if (!bill) return { error: "Tagihan tidak ditemukan" };
  if (bill.next_due_date !== params.dueDate) return { error: "Periode ini sudah dibayar" };

  const amount = params.skip ? null : (params.amount ?? Number(bill.amount));
  if (amount !== null && !(amount > 0)) return { error: "Jumlah harus lebih dari 0" };

  // Account must belong to this user (the bot runs with the service role, so no RLS)
  let account: { id: string; name: string } | null = null;
  if (amount !== null) {
    const accountId = params.accountId ?? bill.account_id;
    let query = supabase.from("accounts").select("id, name").eq("user_id", userId);
    query = accountId ? query.eq("id", accountId) : query.eq("is_default", true);
    const { data } = await query.limit(1).maybeSingle();
    account = data;
    if (!account) return { error: "Dompet tidak ditemukan" };
  }

  // Later periods that were already settled (e.g. after undoing an older payment)
  const { data: later } = await supabase
    .from("bill_payments")
    .select("due_date")
    .eq("bill_id", bill.id)
    .gt("due_date", params.dueDate);
  const nextDue = nextDueAfter(bill, params.dueDate, new Set((later || []).map((p) => p.due_date)));

  const date = params.date || todayWIB();
  const { error } = await supabase.rpc("pay_bill", {
    p_user_id: userId,
    p_bill_id: bill.id,
    p_due_date: params.dueDate,
    p_next_due: nextDue,
    p_amount: amount,
    p_account_id: account?.id ?? null,
    p_date: date,
    p_source: params.source,
  });
  if (error) {
    return { error: error.message.includes("already been settled") ? "Periode ini sudah dibayar" : error.message };
  }

  // Best-effort: the payment is already saved
  let alert: string | null = null;
  if (amount !== null && bill.category_id) {
    try {
      alert = await getBudgetAlert(supabase, { userId, categoryId: bill.category_id, date, amount });
    } catch (err) {
      console.error("Budget alert failed:", err);
    }
  }

  return { bill, amount, accountName: account?.name ?? null, nextDue, alert };
}

export function formatDueDate(date: string): string {
  return format(parseISO(date), "d MMM yyyy", { locale: localeId });
}

/**
 * Bill list for Telegram (plain text, names are user input) with a "paid" button for each
 * bill due within 3 days or overdue. onlyReminders keeps just H-3, H-0 and overdue bills
 * (daily cron). Returns null when there is nothing to show.
 */
export async function buildBillMessage(
  supabase: SupabaseClient,
  userId: string,
  options: { onlyReminders: boolean; today?: string },
): Promise<{ text: string; buttons: { text: string; callback_data: string }[][] } | null> {
  const today = options.today ?? todayWIB();
  const { data: bills, error } = await supabase
    .from("bills")
    .select("id, name, amount, next_due_date")
    .eq("user_id", userId)
    .order("next_due_date");
  if (error) throw error;

  const rows = (bills || [])
    .map((b) => ({ ...b, days: daysUntil(b.next_due_date, today) }))
    .filter((b) => !options.onlyReminders || b.days <= 0 || b.days === 3);
  if (rows.length === 0) return null;

  const lines = rows.map((b) => {
    const icon = b.days < 0 ? "🚨" : b.days <= 3 ? "⚠️" : "🗓";
    return `${icon} ${b.name} — ${formatRupiah(Number(b.amount))}\n    ${dueLabel(b.days)} (${formatDueDate(b.next_due_date)})`;
  });
  const buttons = rows
    .filter((b) => b.days <= 3)
    // callback_data limit is 64 bytes: "bp:" + uuid + ":" + date = 50
    .map((b) => [{ text: `✅ Sudah bayar ${b.name}`.slice(0, 60), callback_data: `bp:${b.id}:${b.next_due_date}` }]);

  const title = options.onlyReminders ? "🔔 Pengingat Tagihan" : "🧾 Tagihan";
  return { text: `${title}\n\n${lines.join("\n\n")}`, buttons };
}
