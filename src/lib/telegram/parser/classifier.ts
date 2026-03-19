/**
 * CLASSIFIER
 * Klasifikasi pesan ke transaction/query/unknown
 */

import { QUERY_KEYWORDS, EXPENSE_KEYWORDS, INCOME_KEYWORDS } from "./keywords";
import { hasAmount } from "./amount";

export type MessageType = "transaction" | "query" | "unknown";

/**
 * Klasifikasi pesan ke tipe yang sesuai
 */
export function classifyMessage(message: string): MessageType {
  const lower = message.toLowerCase().trim();

  // Skip commands (starts with /)
  if (lower.startsWith("/")) {
    return "unknown";
  }

  // Check query patterns
  if (isQueryMessage(lower)) {
    return "query";
  }

  // Check transaction patterns
  if (isTransactionMessage(lower)) {
    return "transaction";
  }

  return "unknown";
}

/**
 * Cek apakah pesan adalah query
 */
function isQueryMessage(lower: string): boolean {
  // Pattern 1: "berapa [pengeluaran|saldo|total]"
  if (lower.startsWith("berapa")) {
    return true;
  }

  // Pattern 2: "[pengeluaran|pemasukan] [berapa|minggu|bulan]"
  if (lower.includes("pengeluaran") || lower.includes("pemasukan")) {
    return true;
  }

  // Pattern 3: "saldo" or "balance"
  if (
    lower.includes("saldo") ||
    lower.includes("balance") ||
    lower.includes("duit")
  ) {
    return true;
  }

  // Pattern 4: "riwayat" or "history"
  if (lower.includes("riwayat") || lower.includes("history")) {
    return true;
  }

  // Pattern 5: "transaksi terakhir" or "recent"
  if (lower.includes("transaksi terakhir") || lower.includes("recent")) {
    return true;
  }

  // Pattern 6: has QUERY_KEYWORDS but NO amount
  if (hasKeyword(lower, QUERY_KEYWORDS) && !hasAmount(lower)) {
    return true;
  }

  return false;
}

/**
 * Cek apakah pesan adalah transaction
 */
function isTransactionMessage(lower: string): boolean {
  // Pattern 1: has amount
  if (hasAmount(lower)) {
    return true;
  }

  // Pattern 2: has EXPENSE_KEYWORDS or INCOME_KEYWORDS
  if (
    hasKeyword(lower, EXPENSE_KEYWORDS) ||
    hasKeyword(lower, INCOME_KEYWORDS)
  ) {
    return true;
  }

  return false;
}

/**
 * Helper: Cek apakah string mengandung keyword dari array
 */
function hasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
