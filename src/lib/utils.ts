import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TransferType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Transaction dates are plain YYYY-MM-DD on the WIB calendar. The server (Vercel) runs
// in UTC, so new Date().toISOString() would still be "yesterday" before 07:00 WIB.
export function todayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date())
}

// Shared by web and Telegram bot: money into an investment account is a purchase,
// money out of one is a withdrawal
export function getTransferType(fromType?: string, toType?: string): TransferType {
  if (fromType !== "investment" && toType === "investment") return "investment"
  if (fromType === "investment" && toType !== "investment") return "divestment"
  return "regular"
}
