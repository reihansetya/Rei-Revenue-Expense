/**
 * TRANSFER PARSER
 * Parse transfer dari natural language
 */

import { extractAmount } from "./amount";
import { extractDate } from "./date";
import { findAccountByKeyword } from "./keywords";

export interface ParsedTransfer {
  amount: number;
  date: string;
  srcAccount: {
    id: string | null;
    name: string | null;
  };
  dstAccount: {
    id: string | null;
    name: string | null;
  };
  description: string | null;
  confidence: "high" | "medium" | "low";
  originalMessage: string;
}

/**
 * Parse transfer dari pesan natural language
 * Support format:
 * - `/transfer <amount> <src> <dst>`
 * - `transfer <amount> <src> <dst>`
 * - `transfer <amount> dari <src> ke <dst>`
 * - `transfer <amount> dari <src> ke <dst> [catatan]`
 */
export function parseTransfer(
  message: string,
  accounts: { id: string; name: string; type: string }[],
): ParsedTransfer {
  const lower = message.toLowerCase().trim();

  // Step 1: Extract Amount
  const amount = extractAmount(message);

  // Step 2: Extract Date
  const dateObj = extractDate(message);
  const date = dateObj.date;

  // Step 3: Extract Source and Destination Accounts
  const { srcAccount, dstAccount, description } = extractAccountsAndDescription(
    message,
    accounts,
  );

  // Step 4: Determine Confidence
  const confidence = calculateTransferConfidence(
    amount,
    srcAccount.name,
    dstAccount.name,
  );

  return {
    amount: amount || 0,
    date,
    srcAccount,
    dstAccount,
    description,
    confidence,
    originalMessage: message,
  };
}

/**
 * Extract source account, destination account, dan description
 */
function extractAccountsAndDescription(
  message: string,
  userAccounts: { id: string; name: string; type: string }[],
): {
  srcAccount: { id: string | null; name: string | null };
  dstAccount: { id: string | null; name: string | null };
  description: string | null;
} {
  let lower = message.toLowerCase().trim();

  // Remove transfer keyword
  lower = lower.replace(/^(\/transfer|transfer)\s+/, "").trim();

  // Case 1: Format "dari X ke Y"
  const dariKePattern = /dari\s+(\w+)\s+ke\s+(\w+)/i;
  const dariKeMatch = dariKePattern.exec(lower);

  if (dariKeMatch) {
    const srcName = dariKeMatch[1];
    const dstName = dariKeMatch[2];

    // Extract description (sisa text setelah "ke Y")
    let description = lower.replace(dariKeMatch[0], "").trim();
    // Remove amount from description
    description = description
      .replace(/[\d.,]+\s*(jt|juta|rb|ribu|r|k)?/gi, "")
      .trim();
    // Remove common filler words
    description = removeFillerWords(description);

    return {
      srcAccount: matchAccount(srcName, userAccounts),
      dstAccount: matchAccount(dstName, userAccounts),
      description: description || null,
    };
  }

  // Case 2: Format "<src> <dst>" (positional)
  // Split words dan filter out amount
  const words = lower.split(/\s+/).filter((w) => {
    // Filter out amounts
    return !/^[\d.,]+(jt|juta|rb|ribu|r|k)?$/i.test(w);
  });

  // Ambil 2 kata pertama sebagai src dan dst
  let srcName = null;
  let dstName = null;
  let remainingWords: string[] = [];

  if (words.length >= 2) {
    srcName = words[0];
    dstName = words[1];
    remainingWords = words.slice(2);
  } else if (words.length === 1) {
    // Hanya 1 akun yang terdeteksi - coba detect dari keyword
    srcName = words[0];
    remainingWords = [];
  }

  // Extract description dari remaining words
  let description = remainingWords.join(" ");
  description = removeFillerWords(description);

  return {
    srcAccount: srcName
      ? matchAccount(srcName, userAccounts)
      : { id: null, name: null },
    dstAccount: dstName
      ? matchAccount(dstName, userAccounts)
      : { id: null, name: null },
    description: description || null,
  };
}

/**
 * Match account name ke user's account
 */
function matchAccount(
  accountName: string,
  userAccounts: { id: string; name: string; type: string }[],
): { id: string | null; name: string | null } {
  // 1. Cari exact match (case-insensitive)
  const exactMatch = userAccounts.find(
    (a) => a.name.toLowerCase() === accountName.toLowerCase(),
  );
  if (exactMatch) {
    return { id: exactMatch.id, name: exactMatch.name };
  }

  // 2. Cari partial match
  const partialMatch = userAccounts.find(
    (a) =>
      a.name.toLowerCase().includes(accountName.toLowerCase()) ||
      accountName.toLowerCase().includes(a.name.toLowerCase()),
  );
  if (partialMatch) {
    return { id: partialMatch.id, name: partialMatch.name };
  }

  // 3. Cek keyword mapping
  const keywordAccount = findAccountByKeyword(accountName);
  if (keywordAccount) {
    const keywordMatch = userAccounts.find(
      (a) => a.name.toLowerCase() === keywordAccount.toLowerCase(),
    );
    if (keywordMatch) {
      return { id: keywordMatch.id, name: keywordMatch.name };
    }
  }

  return { id: null, name: accountName };
}

/**
 * Remove filler words dari description
 */
function removeFillerWords(text: string): string {
  const fillerWords = ["untuk", "buat", "dengan", "pakai", "via", "melalui"];

  let cleaned = text;
  fillerWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    cleaned = cleaned.replace(regex, " ").trim();
  });

  return cleaned;
}

/**
 * Calculate confidence level untuk transfer
 */
function calculateTransferConfidence(
  amount: number | null,
  srcAccount: string | null,
  dstAccount: string | null,
): "high" | "medium" | "low" {
  // High: amount + src account + dst account detected
  if (amount && srcAccount && dstAccount) {
    return "high";
  }

  // Medium: amount + 1 account detected
  if (amount && (srcAccount || dstAccount)) {
    return "medium";
  }

  // Low: missing amount or no accounts detected
  return "low";
}
