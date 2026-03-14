import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  categories: { name: string; icon: string; color: string } | null;
  accounts: { name: string } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
        <Link
          href="/transactions"
          className="text-xs text-primary hover:underline"
        >
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                    style={{
                      backgroundColor: t.categories
                        ? `${t.categories.color}20`
                        : t.type === "income"
                        ? "#10B98120"
                        : "#EF444420",
                    }}
                  >
                    {t.categories?.icon ||
                      (t.type === "income" ? "💰" : "💸")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t.categories?.name ||
                        (t.type === "income" ? "Pemasukan" : "Pengeluaran")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.description || "Tidak ada catatan"}
                      {t.accounts && ` · ${t.accounts.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.date), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    t.type === "income" ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatRupiah(Number(t.amount))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Belum ada transaksi
          </div>
        )}
      </CardContent>
    </Card>
  );
}
