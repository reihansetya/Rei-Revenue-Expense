/**
 * PARSER MODULE - MAIN ENTRY POINT
 * Export semua parser sebagai satu modul
 */

// Imports untuk types
import type { MessageType } from "./classifier";
import type { ParsedTransaction } from "./transaction";
import type { ParsedQuery } from "./query";
import type { ParsedTransfer } from "./transfer";

// Import functions untuk internal use
import { classifyMessage } from "./classifier";
import {
  parseTransaction,
  matchCategoryToUserCategory,
  matchAccountToUserAccount,
} from "./transaction";
import { parseQuery } from "./query";
import { parseTransfer } from "./transfer";
import { extractAmount, parseAmount, hasAmount, formatRupiah } from "./amount";
import {
  extractDate,
  getDateRange,
  getPeriodLabel,
  getCurrentMonthRange,
} from "./date";
import {
  EXPENSE_KEYWORDS,
  INCOME_KEYWORDS,
  QUERY_KEYWORDS,
  CATEGORY_KEYWORDS,
  ACCOUNT_KEYWORDS,
  QUERY_TYPE_KEYWORDS,
  PERIOD_KEYWORDS,
  containsKeyword,
  findCategoryByKeyword,
  findAccountByKeyword,
} from "./keywords";

// Re-export types
export type { MessageType } from "./classifier";
export type { ParsedTransaction } from "./transaction";
export type { ParsedQuery } from "./query";
export type { ParsedTransfer } from "./transfer";

// Re-export functions
export { classifyMessage } from "./classifier";
export {
  parseTransaction,
  matchCategoryToUserCategory,
  matchAccountToUserAccount,
} from "./transaction";
export { parseQuery } from "./query";
export { parseTransfer } from "./transfer";
export { extractAmount, parseAmount, hasAmount, formatRupiah } from "./amount";
export {
  extractDate,
  getDateRange,
  getPeriodLabel,
  getCurrentMonthRange,
} from "./date";
export {
  EXPENSE_KEYWORDS,
  INCOME_KEYWORDS,
  QUERY_KEYWORDS,
  CATEGORY_KEYWORDS,
  ACCOUNT_KEYWORDS,
  QUERY_TYPE_KEYWORDS,
  PERIOD_KEYWORDS,
  containsKeyword,
  findCategoryByKeyword,
  findAccountByKeyword,
} from "./keywords";

/**
 * Main processor function
 * Process message dan return hasil parsing
 */
export function processMessage(
  message: string,
  context: {
    categories: { id: string; name: string; type: string }[];
    accounts: { id: string; name: string; type: string }[];
  },
): {
  type: MessageType;
  transaction?: ParsedTransaction;
  query?: ParsedQuery;
} {
  const messageType = classifyMessage(message);

  if (messageType === "transaction") {
    const transaction = parseTransaction(
      message,
      context.categories,
      context.accounts,
    );
    return { type: "transaction", transaction };
  }

  if (messageType === "query") {
    const query = parseQuery(message);
    return { type: "query", query };
  }

  return { type: "unknown" };
}
