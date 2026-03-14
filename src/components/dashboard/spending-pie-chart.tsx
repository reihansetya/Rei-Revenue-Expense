"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CategoryData {
  name: string;
  icon: string;
  color: string;
  total: number;
}

interface SpendingPieChartProps {
  data: CategoryData[];
  totalExpense: number;
}

export function SpendingPieChart({
  data,
  totalExpense,
}: SpendingPieChartProps) {
  // Transform data for recharts
  const chartData = data.map((item) => ({
    name: `${item.icon} ${item.name}`,
    value: item.total,
    color: item.color,
  }));

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Belum ada pengeluaran bulan ini
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => formatRupiah(Number(value))}
              contentStyle={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
                border: "none",
                borderRadius: "8px",
              }}
            />
            <Legend
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* List breakdown */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((item) => {
            const percentage =
              totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex items-center gap-1">
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {percentage.toFixed(0)}%
                  </span>
                  <span className="font-medium">
                    {formatRupiah(item.total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
