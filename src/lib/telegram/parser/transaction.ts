/**
 * TRANSACTION PARSER
 * Parse transaksi dari natural language
 */

import { extractAmount } from "./amount";
import { extractDate } from "./date";
import {
  INCOME_KEYWORDS,
  findCategoryByKeyword,
  findAccountByKeyword,
} from "./keywords";

export interface ParsedTransaction {
  amount: number;
  type: "expense" | "income";
  date: string;
  category: {
    id: string | null;
    name: string | null;
  };
  account: {
    id: string | null;
    name: string | null;
  };
  description: string | null;
  merchant: string | null;
  confidence: "high" | "medium" | "low";
  originalMessage: string;
}

/**
 * Parse transaksi dari pesan natural language
 */
export function parseTransaction(
  message: string,
  categories: { id: string; name: string; type: string }[],
  accounts: { id: string; name: string; type: string }[],
): ParsedTransaction {
  const lower = message.toLowerCase().trim();

  // Step 1: Extract Amount
  const amount = extractAmount(message);

  // Step 2: Detect Type
  let type: "expense" | "income" = "expense";
  if (INCOME_KEYWORDS.some((kw) => lower.includes(kw))) {
    type = "income";
  }

  // Step 3: Extract Date
  const dateObj = extractDate(message);
  const date = dateObj.date;

  // Step 4: Detect Category
  const parsedCategory = findCategoryByKeyword(message);
  const category = matchCategoryToUserCategory(
    parsedCategory.name,
    type,
    categories,
  );

  // Step 5: Detect Account
  const account = matchAccountToUserAccount(message, accounts);

  // Step 6: Extract Merchant/Description
  const { merchant, description } = extractMerchantAndDescription(
    message,
    amount,
    parsedCategory.name,
    account.name,
  );

  // Step 7: Determine Confidence
  const confidence = calculateConfidence(amount, type, category.name);

  return {
    amount: amount || 0,
    type,
    date,
    category,
    account,
    description,
    merchant,
    confidence,
    originalMessage: message,
  };
}

/**
 * Match parsed category ke user's category
 */
export function matchCategoryToUserCategory(
  parsedCategory: string | null,
  type: "expense" | "income",
  userCategories: { id: string; name: string; type: string }[],
): { id: string | null; name: string | null } {
  // Jika tidak ada parsed category, return null
  if (!parsedCategory) {
    return { id: null, name: null };
  }

  // Cari exact match (case-insensitive)
  const exactMatch = userCategories.find(
    (c) =>
      c.type === type && c.name.toLowerCase() === parsedCategory.toLowerCase(),
  );
  if (exactMatch) {
    return { id: exactMatch.id, name: exactMatch.name };
  }

  // Cari partial match
  const partialMatch = userCategories.find(
    (c) =>
      c.type === type &&
      (c.name.toLowerCase().includes(parsedCategory.toLowerCase()) ||
        parsedCategory.toLowerCase().includes(c.name.toLowerCase())),
  );
  if (partialMatch) {
    return { id: partialMatch.id, name: partialMatch.name };
  }

  // Fallback ke "Lainnya" atau "Other"
  const fallback = userCategories.find(
    (c) =>
      c.type === type &&
      (c.name.toLowerCase() === "lainnya" || c.name.toLowerCase() === "other"),
  );
  if (fallback) {
    return { id: fallback.id, name: fallback.name };
  }

  return { id: null, name: parsedCategory };
}

/**
 * Match account ke user's account
 */
export function matchAccountToUserAccount(
  message: string,
  userAccounts: { id: string; name: string; type: string }[],
): { id: string | null; name: string | null } {
  // Cek keyword-based account detection
  const keywordAccount = findAccountByKeyword(message);
  if (keywordAccount) {
    const match = userAccounts.find(
      (a) => a.name.toLowerCase() === keywordAccount.toLowerCase(),
    );
    if (match) {
      return { id: match.id, name: match.name };
    }
  }

  // Cek pattern: "pakai/dari/ke [account name]"
  const lower = message.toLowerCase();
  const patterns = [/pakai\s+(\w+)/, /dari\s+(\w+)/, /ke\s+(\w+)/];

  for (const pattern of patterns) {
    const match = pattern.exec(lower);
    if (match) {
      const accountName = match[1];
      const account = userAccounts.find((a) =>
        a.name.toLowerCase().includes(accountName.toLowerCase()),
      );
      if (account) {
        return { id: account.id, name: account.name };
      }
    }
  }

  return { id: null, name: null };
}

/**
 * Extract merchant dan description dari pesan
 */
function extractMerchantAndDescription(
  message: string,
  amount: number | null,
  categoryName: string | null,
  accountName: string | null,
): { merchant: string | null; description: string | null } {
  let text = message.toLowerCase().trim();

  // Remove amount (simple approach)
  if (amount) {
    text = text.replace(/[\d.,]+\s*(jt|juta|rb|ribu|r|k)?/gi, "").trim();
  }

  // Remove keywords yang sudah teridentifikasi
  const removeKeywords: string[] = [];
  if (categoryName) {
    removeKeywords.push(categoryName.toLowerCase());
  }
  if (accountName) {
    removeKeywords.push(accountName.toLowerCase());
  }

  // Hapus common filler words
  const fillerWords = [
    "pakai",
    "dari",
    "ke",
    "di",
    "untuk",
    "buat",
    "di",
    "dengan",
  ];
  fillerWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    text = text.replace(regex, "").trim();
  });

  // Split words dan filter yang bukan filler
  const words = text.split(/\s+/).filter((w) => w.length > 1);

  // Jika tidak ada words, return null
  if (words.length === 0) {
    return { merchant: null, description: null };
  }

  // Merchant: words pertama (biasanya nama tempat)
  const merchant = words[0].charAt(0).toUpperCase() + words[0].slice(1);

  // Description: sisa words
  const description =
    words.length > 1
      ? words.slice(1).join(" ").charAt(0).toUpperCase() +
        words.slice(1).join(" ").slice(1)
      : null;

  return { merchant, description };
}

/**
 * Calculate confidence level berdasarkan data yang terdeteksi
 */
function calculateConfidence(
  amount: number | null,
  type: "expense" | "income",
  category: string | null,
): "high" | "medium" | "low" {
  // High: amount + type + category detected
  if (amount && category) {
    return "high";
  }

  // Medium: amount + type only
  if (amount) {
    return "medium";
  }

  // Low: missing amount or unknown type
  return "low";
}
