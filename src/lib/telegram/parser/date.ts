/**
 * DATE PARSER
 * Extract tanggal dari text (relative & absolute)
 */

import { todayWIB } from "../../utils";

/**
 * Today on the WIB calendar, anchored at UTC midnight. All arithmetic below uses
 * UTC methods, so results are identical on a UTC server (webhook on Vercel) and
 * a WIB machine (polling bot).
 */
function getToday(): Date {
  return new Date(`${todayWIB()}T00:00:00Z`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Extract tanggal dari pesan
 * Examples: "kemarin makan" → 2026-03-19, "hari ini belanja" → 2026-03-20
 */
export function extractDate(message: string): {
  date: string;
  isRelative: boolean;
} {
  const lower = message.toLowerCase();
  const today = getToday();

  // Relative date keywords
  if (lower.includes("kemarin") || lower.includes("yesterday")) {
    return {
      date: formatDateToString(addDays(today, -1)),
      isRelative: true,
    };
  }

  if (lower.includes("besok") || lower.includes("tomorrow")) {
    return {
      date: formatDateToString(addDays(today, 1)),
      isRelative: true,
    };
  }

  if (lower.includes("lusa")) {
    return {
      date: formatDateToString(addDays(today, 2)),
      isRelative: true,
    };
  }

  // Pattern: "N hari lalu"
  const daysAgoMatch = lower.match(/(\d+)\s*hari\s*lalu/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    return {
      date: formatDateToString(addDays(today, -days)),
      isRelative: true,
    };
  }

  // Pattern: Day names (senin, selasa, etc.) - get last occurrence
  const dayNames = {
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
    minggu: 0,
  };

  for (const [day, dayNum] of Object.entries(dayNames)) {
    if (lower.includes(day)) {
      const diff = today.getUTCDay() - dayNum;

      // Jika diff positif, kurangi diff hari
      // Jika diff negatif atau 0, itu hari ini/minggu ini, ambil minggu lalu
      const daysToSubtract = diff >= 0 ? diff : 7 + diff;

      return {
        date: formatDateToString(addDays(today, -daysToSubtract)),
        isRelative: true,
      };
    }
  }

  // Default: hari ini
  return {
    date: formatDateToString(today),
    isRelative: false,
  };
}

/**
 * Get date range berdasarkan period
 */
export function getDateRange(
  period:
    | "today"
    | "yesterday"
    | "this_week"
    | "this_month"
    | "last_month"
    | "all",
): { start: string; end: string } {
  const today = getToday();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();

  switch (period) {
    case "today": {
      const dateStr = formatDateToString(today);
      return { start: dateStr, end: dateStr };
    }

    case "yesterday": {
      const dateStr = formatDateToString(addDays(today, -1));
      return { start: dateStr, end: dateStr };
    }

    case "this_week": {
      // Sunday of current week
      return {
        start: formatDateToString(addDays(today, -today.getUTCDay())),
        end: formatDateToString(today),
      };
    }

    case "this_month": {
      return {
        start: formatDateToString(new Date(Date.UTC(year, month, 1))),
        end: formatDateToString(new Date(Date.UTC(year, month + 1, 0))),
      };
    }

    case "last_month": {
      return {
        start: formatDateToString(new Date(Date.UTC(year, month - 1, 1))),
        end: formatDateToString(new Date(Date.UTC(year, month, 0))),
      };
    }

    case "all":
      return {
        start: "2000-01-01",
        end: "2100-12-31",
      };

    default: {
      const dateStr = formatDateToString(today);
      return { start: dateStr, end: dateStr };
    }
  }
}

/**
 * Get label untuk period (untuk display)
 */
export function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    today: "Hari Ini",
    yesterday: "Kemarin",
    this_week: "Minggu Ini",
    this_month: "Bulan Ini",
    last_month: "Bulan Lalu",
    all: "Semua Waktu",
  };

  return labels[period] || period;
}

/**
 * Helper: Format date ke ISO string (YYYY-MM-DD)
 * Safe because every date here is anchored at UTC midnight.
 */
function formatDateToString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get start & end of current month (legacy function)
 */
export function getCurrentMonthRange() {
  return getDateRange("this_month");
}
