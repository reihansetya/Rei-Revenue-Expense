"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatRupiah(amount: number) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}jt`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}rb`;
  }
  return amount.toString();
}

interface DailyData {
  date: string;
  fullDate: string;
  income: number;
  expense: number;
}

interface DailyTrendChartProps {
  data: DailyData[];
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
  // Filter only days with transactions
  const activeDays = data.filter((d) => d.income > 0 || d.expense > 0);

  if (activeDays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaksi Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Belum ada transaksi bulan ini
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transaksi Harian Bulan Ini</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={activeDays}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(value) => formatRupiah(value)}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value: any) => [
                `Rp ${Number(value).toLocaleString("id-ID")}`,
              ]}
              contentStyle={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
                border: "none",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              name="Pemasukan"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Pengeluaran"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
