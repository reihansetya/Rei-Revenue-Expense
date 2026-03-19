/**
 * QUERY PARSER
 * Parse query untuk data retrieval
 */

import { QUERY_TYPE_KEYWORDS, PERIOD_KEYWORDS } from "./keywords";
import { findCategoryByKeyword } from "./keywords";

export interface ParsedQuery {
  queryType:
    | "expense_summary"
    | "income_summary"
    | "balance"
    | "category_breakdown"
    | "recent"
    | "general";
  period:
    | "today"
    | "yesterday"
    | "this_week"
    | "this_month"
    | "last_month"
    | "all";
  category?: string;
  originalMessage: string;
}

/**
 * Parse query untuk data retrieval
 */
export function parseQuery(message: string): ParsedQuery {
  const lower = message.toLowerCase().trim();

  // Default values
  let queryType: ParsedQuery["queryType"] = "general";
  let period: ParsedQuery["period"] = "this_month";
  let category: string | undefined = undefined;

  // Detect query type
  queryType = detectQueryType(lower);

  // Detect period
  period = detectPeriod(lower);

  // Detect category-specific query
  if (queryType === "expense_summary") {
    const categoryMatch = findCategoryByKeyword(message);
    if (categoryMatch.name) {
      category = categoryMatch.name;
      queryType = "category_breakdown";
    }
  }

  return {
    queryType,
    period,
    category,
    originalMessage: message,
  };
}

/**
 * Detect query type dari pesan
 */
function detectQueryType(lower: string): ParsedQuery["queryType"] {
  // Check exact keyword matches
  for (const [keyword, type] of Object.entries(QUERY_TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return type as ParsedQuery["queryType"];
    }
  }

  // Default to general summary
  return "general";
}

/**
 * Detect period dari pesan
 */
function detectPeriod(lower: string): ParsedQuery["period"] {
  // Check exact period keywords
  for (const [keyword, period] of Object.entries(PERIOD_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return period as ParsedQuery["period"];
    }
  }

  // Default to this_month
  return "this_month";
}
