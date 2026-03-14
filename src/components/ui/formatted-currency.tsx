"use client";

import { useHideNominal } from "@/components/providers/hide-nominal-provider";
import { cn } from "@/lib/utils";

interface FormattedCurrencyProps {
  amount: number;
  className?: string;
  showSign?: boolean;
  sign?: "+" | "-";
  hiddenChar?: string;
  hiddenLength?: number;
}

/**
 * Format angka ke format Rupiah dengan opsi hide
 * 
 * @example
 * // Normal usage
 * <FormattedCurrency amount={5000000} />
 * // Output: Rp 5.000.000 (atau Rp •••••••• jika hide mode aktif)
 * 
 * @example
 * // With sign
 * <FormattedCurrency amount={50000} showSign sign="-" />
 * // Output: -Rp 50.000 (atau -Rp •••••• jika hide mode aktif)
 */
export function FormattedCurrency({
  amount,
  className,
  showSign = false,
  sign = "-",
  hiddenChar = "•",
  hiddenLength,
}: FormattedCurrencyProps) {
  const { isHidden } = useHideNominal();

  // Format currency
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Generate hidden value
  const getHiddenValue = () => {
    // Calculate length based on amount magnitude
    const length = hiddenLength ?? Math.min(Math.max(String(Math.abs(amount)).length, 4), 12);
    const dots = hiddenChar.repeat(length);
    return `${showSign ? sign : ""}Rp ${dots}`;
  };

  // Sign prefix for negative values
  const signPrefix = showSign && amount < 0 ? "-" : showSign ? sign : "";

  if (isHidden) {
    return (
      <span className={cn("tabular-nums", className)}>
        {getHiddenValue()}
      </span>
    );
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {signPrefix}
      {formatted}
    </span>
  );
}

/**
 * Simple hook to format currency with hide support
 * Use this when you need the string value without component
 */
export function useFormattedCurrency(amount: number): string {
  const { isHidden } = useHideNominal();

  if (isHidden) {
    const length = Math.min(Math.max(String(Math.abs(amount)).length, 4), 12);
    return `Rp ${"•".repeat(length)}`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Component for hiding any numeric value
 */
interface HiddenValueProps {
  value: string | number;
  className?: string;
  hiddenChar?: string;
}

export function HiddenValue({
  value,
  className,
  hiddenChar = "•",
}: HiddenValueProps) {
  const { isHidden } = useHideNominal();

  if (isHidden) {
    const length = String(value).length;
    return (
      <span className={className}>
        {hiddenChar.repeat(Math.max(length, 4))}
      </span>
    );
  }

  return <span className={className}>{value}</span>;
}
