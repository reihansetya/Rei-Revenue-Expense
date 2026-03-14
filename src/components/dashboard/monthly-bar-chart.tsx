"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHideNominal } from "@/components/providers/hide-nominal-provider";

function formatRupiah(amount: number) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}jt`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}rb`;
  }
  return amount.toString();
}

interface MonthlyData {
  month: string;
  fullMonth: string;
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: MonthlyData[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const { isHidden } = useHideNominal();
  // Check if all data is zero
  // Check if all data is zero
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaksi Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-62.5 text-muted-foreground">
            Belum ada data transaksi
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Transaksi Bulanan (6 Bulan Terakhir)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={(value) => isHidden ? "•" : formatRupiah(value)}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              formatter={(value: any) => [
                isHidden ? "Rp ••••••" : `Rp ${Number(value).toLocaleString("id-ID")}`,
              ]}
              labelFormatter={(label) => {
                const item = data.find((d) => d.month === label);
                return item?.fullMonth || label;
              }}
              contentStyle={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
                border: "none",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="income"
              name="Pemasukan"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="Pengeluaran"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
