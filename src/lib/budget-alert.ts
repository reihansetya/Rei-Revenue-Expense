import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRupiah } from "./telegram/utils";
import { todayWIB } from "./utils";

// Highest first: a single expense that jumps past several thresholds sends one alert
const ALERT_THRESHOLDS = [100, 80];

// Month of a YYYY-MM-DD date: first/last day and an Indonesian label
function monthOf(date: string) {
  const [year, month] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = date.slice(0, 7);
  return {
    start: `${prefix}-01`,
    end: `${prefix}-${String(lastDay).padStart(2, "0")}`,
    label: new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
}

/**
 * Call right after an expense is saved. Returns an alert message when this expense
 * pushed the category's monthly total across a threshold, otherwise null.
 * Stateless: "crossed" = total before this expense < threshold <= total after it,
 * so each threshold fires once per month without storing what was already sent.
 */
export async function getBudgetAlert(
  supabase: SupabaseClient,
  params: { userId: string; categoryId: string; date: string; amount: number },
): Promise<string | null> {
  const { userId, categoryId, date, amount } = params;
  const month = monthOf(date);

  const [{ data: category }, { data: rows }] = await Promise.all([
    supabase
      .from("categories")
      .select("name, icon, budget")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("type", "expense")
      .gte("date", month.start)
      .lte("date", month.end),
  ]);

  const budget = Number(category?.budget);
  if (!category || !budget || budget <= 0) return null;

  // Total already includes the expense that was just saved
  const total = (rows || []).reduce((sum, r) => sum + Number(r.amount), 0);
  const previous = total - amount;
  const crossed = ALERT_THRESHOLDS.find((t) => {
    const limit = (budget * t) / 100;
    return previous < limit && total >= limit;
  });
  if (!crossed) return null;

  const name = `${category.icon ?? ""} ${category.name}`.trim();
  const percentage = Math.floor((total / budget) * 100);

  if (crossed === 100) {
    return (
      `🚨 Budget ${name} terlampaui (${month.label})\n` +
      `${formatRupiah(total)} dari ${formatRupiah(budget)} — lebih ${formatRupiah(total - budget)}`
    );
  }
  return (
    `⚠️ Budget ${name} sudah ${percentage}% terpakai (${month.label})\n` +
    `${formatRupiah(total)} dari ${formatRupiah(budget)} — sisa ${formatRupiah(budget - total)}`
  );
}

/**
 * Status of every budgeted category for the current WIB month (/budget, weekly recap).
 * Returns null when the user has no budgets.
 */
export async function getBudgetStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const month = monthOf(todayWIB());

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon, budget")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gt("budget", 0)
    .order("name");

  if (!categories || categories.length === 0) return null;

  const { data: rows } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .in("category_id", categories.map((c) => c.id))
    .gte("date", month.start)
    .lte("date", month.end);

  const totalByCategory = new Map<string, number>();
  (rows || []).forEach((r) => {
    totalByCategory.set(r.category_id, (totalByCategory.get(r.category_id) || 0) + Number(r.amount));
  });

  const lines = categories.map((c) => {
    const budget = Number(c.budget);
    const total = totalByCategory.get(c.id) || 0;
    const percentage = Math.floor((total / budget) * 100);
    const status = percentage >= 100 ? "🚨" : percentage >= 80 ? "⚠️" : "✅";
    return (
      `${status} ${c.icon ?? ""} ${c.name}: ${percentage}%\n` +
      `    ${formatRupiah(total)} / ${formatRupiah(budget)}`
    );
  });

  return `📊 Budget ${month.label}\n\n${lines.join("\n\n")}`;
}
