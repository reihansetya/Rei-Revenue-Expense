"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedCurrency } from "@/components/ui/formatted-currency";

interface BudgetProgressProps {
  data: {
    name: string;
    icon: string;
    color: string;
    total: number;
    budget: number | null;
  }[];
}

export function BudgetProgress({ data }: BudgetProgressProps) {
  const budgetData = data.filter((item) => item.budget && item.budget > 0);

  if (budgetData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pantauan Anggaran</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {budgetData.map((item) => {
          const budget = item.budget || Number.MAX_VALUE;
          const percentage = Math.min((item.total / budget) * 100, 100);
          
          let progressColor = item.color;
          if (percentage >= 90) {
            progressColor = "#EF4444"; // Red when almost/over limit
          } else if (percentage >= 70) {
            progressColor = "#F59E0B"; // Amber when getting close
          }

          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                  <FormattedCurrency amount={item.total} /> / <FormattedCurrency amount={item.budget || 0} />
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${percentage}%`, backgroundColor: progressColor }}
                />
              </div>
              {percentage >= 100 && (
                <p className="text-xs text-red-500 font-medium">Anggaran sudah melebihi batas bulan ini.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
