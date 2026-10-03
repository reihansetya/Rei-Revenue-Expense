"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import { cn, todayWIB } from "@/lib/utils";
import { daysUntil, dueLabel } from "@/lib/bills";
import { useBills } from "@/queries/bills";

// Overdue bills and bills due within a week; independent of the dashboard's selected month
export function UpcomingBills() {
  const { data: bills = [] } = useBills();
  const today = todayWIB();
  const upcoming = bills
    .map((bill) => ({ ...bill, days: daysUntil(bill.next_due_date, today) }))
    .filter((bill) => bill.days <= 7);

  if (upcoming.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tagihan Mendatang</CardTitle>
        <Link href="/bills" className="text-sm text-primary hover:underline">
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent className="grid gap-3">
        {upcoming.map((bill) => (
          <Link key={bill.id} href="/bills" className="flex items-center justify-between text-sm">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {bill.categories?.icon} {bill.name}
              </p>
              <p
                className={cn(
                  "text-xs",
                  bill.days < 0 ? "text-rose-500 font-medium" : bill.days <= 3 ? "text-amber-500 font-medium" : "text-muted-foreground",
                )}
              >
                {dueLabel(bill.days)}
              </p>
            </div>
            <FormattedCurrency amount={Number(bill.amount)} className="shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
