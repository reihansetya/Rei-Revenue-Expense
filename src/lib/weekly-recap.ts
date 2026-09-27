import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRupiah } from "./telegram/utils";
import { todayWIB } from "./utils";
import { getBudgetStatus } from "./budget-alert";

const DAY_MS = 24 * 60 * 60 * 1000;

// Dates on the WIB calendar, anchored at UTC midnight (same approach as the bot's date parser)
const toDateStr = (date: Date) => date.toISOString().split("T")[0];
const formatDay = (date: Date, withYear = false) =>
  date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
    timeZone: "UTC",
  });

/**
 * The last full week (Monday–Sunday, WIB) before `today`, plus the start of the week
 * before it for comparison. Correct whatever day the cron actually fires on.
 */
export function getRecapWeek(today: string = todayWIB()) {
  const todayDate = new Date(`${today}T00:00:00Z`);
  const daysSinceMonday = (todayDate.getUTCDay() + 6) % 7;
  const thisMonday = todayDate.getTime() - daysSinceMonday * DAY_MS;
  const start = new Date(thisMonday - 7 * DAY_MS);
  const end = new Date(thisMonday - DAY_MS);

  return {
    start: toDateStr(start),
    end: toDateStr(end),
    previousStart: toDateStr(new Date(thisMonday - 14 * DAY_MS)),
    label: `${formatDay(start)} – ${formatDay(end, true)}`,
  };
}

/**
 * Weekly recap text for one user (plain text: category names are user input).
 * Transfers are not income/expense, so they are not included.
 */
export async function buildWeeklyRecap(
  supabase: SupabaseClient,
  userId: string,
  today?: string,
): Promise<string> {
  const week = getRecapWeek(today);

  const [{ data: rows, error }, budgetStatus] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, date, categories(name, icon)")
      .eq("user_id", userId)
      .gte("date", week.previousStart)
      .lte("date", week.end),
    getBudgetStatus(supabase, userId),
  ]);
  if (error) throw error;

  const lastWeek = (rows || []).filter((r) => r.date >= week.start);
  const previousWeek = (rows || []).filter((r) => r.date < week.start);
  const sum = (list: typeof lastWeek, type: string) =>
    list.filter((r) => r.type === type).reduce((total, r) => total + Number(r.amount), 0);

  let message = `📅 Rekap Mingguan\n${week.label}\n\n`;

  if (lastWeek.length === 0) {
    message += "Minggu lalu belum ada transaksi tercatat.";
  } else {
    const income = sum(lastWeek, "income");
    const expense = sum(lastWeek, "expense");
    const previousExpense = sum(previousWeek, "expense");
    const net = income - expense;

    let comparison = "";
    if (previousExpense > 0) {
      const change = Math.round(((expense - previousExpense) / previousExpense) * 100);
      comparison =
        change === 0
          ? " (hampir sama dengan minggu sebelumnya)"
          : ` (${change > 0 ? "↑" : "↓"} ${Math.abs(change)}% dari minggu sebelumnya)`;
    }

    message +=
      `💰 Pemasukan: ${formatRupiah(income)}\n` +
      `💸 Pengeluaran: ${formatRupiah(expense)}${comparison}\n` +
      `📊 Selisih: ${net >= 0 ? "+" : "-"}${formatRupiah(Math.abs(net))}\n` +
      `🧾 ${lastWeek.length} transaksi`;

    // Top 3 expense categories
    const totalByCategory = new Map<string, number>();
    lastWeek
      .filter((r) => r.type === "expense")
      .forEach((r) => {
        // Many-to-one join returns a single object at runtime
        const category = r.categories as unknown as { name: string; icon: string | null } | null;
        const name = category ? `${category.icon ?? ""} ${category.name}`.trim() : "📦 Lainnya";
        totalByCategory.set(name, (totalByCategory.get(name) || 0) + Number(r.amount));
      });
    const top = [...totalByCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    if (top.length > 0) {
      message +=
        `\n\n🏆 Pengeluaran terbesar:\n` +
        top.map(([name, total], i) => `${i + 1}. ${name} — ${formatRupiah(total)}`).join("\n");
    }
  }

  if (budgetStatus) message += `\n\n${budgetStatus}`;
  return message;
}
