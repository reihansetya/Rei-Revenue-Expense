/**
 * DATE PARSER
 * Extract tanggal dari text (relative & absolute)
 */

/**
 * Extract tanggal dari pesan
 * Examples: "kemarin makan" → 2026-03-19, "hari ini belanja" → 2026-03-20
 */
export function extractDate(message: string): {
  date: string;
  isRelative: boolean;
} {
  const lower = message.toLowerCase();
  const today = new Date();

  // Relative date keywords
  if (lower.includes("kemarin") || lower.includes("yesterday")) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      date: formatDateToString(yesterday),
      isRelative: true,
    };
  }

  if (lower.includes("besok") || lower.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      date: formatDateToString(tomorrow),
      isRelative: true,
    };
  }

  if (lower.includes("lusa")) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return {
      date: formatDateToString(dayAfter),
      isRelative: true,
    };
  }

  // Pattern: "N hari lalu"
  const daysAgoMatch = lower.match(/(\d+)\s*hari\s*lalu/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return {
      date: formatDateToString(date),
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
      const date = new Date(today);
      const currentDay = date.getDay();
      const diff = currentDay - dayNum;

      // Jika diff positif, kurangi diff hari
      // Jika diff negatif atau 0, itu hari ini/minggu ini, ambil minggu lalu
      const daysToSubtract = diff >= 0 ? diff : 7 + diff;
      date.setDate(date.getDate() - daysToSubtract);

      return {
        date: formatDateToString(date),
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
  const today = new Date();

  switch (period) {
    case "today": {
      const dateStr = formatDateToString(today);
      return { start: dateStr, end: dateStr };
    }

    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = formatDateToString(yesterday);
      return { start: dateStr, end: dateStr };
    }

    case "this_week": {
      // Sunday of current week
      const start = new Date(today);
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);

      return {
        start: formatDateToString(start),
        end: formatDateToString(today),
      };
    }

    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      return {
        start: formatDateToString(start),
        end: formatDateToString(end),
      };
    }

    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);

      return {
        start: formatDateToString(start),
        end: formatDateToString(end),
      };
    }

    case "all":
      return {
        start: "2000-01-01",
        end: "2100-12-31",
      };

    default:
      return {
        start: formatDateToString(today),
        end: formatDateToString(today),
      };
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
