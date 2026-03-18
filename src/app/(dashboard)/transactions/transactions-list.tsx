"use client";

import { useState } from "react";
import { Account, Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ReceiptText } from "lucide-react";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import { createTransaction, deleteTransaction, getTransactions } from "./actions";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { FilterBar, FilterState } from "./filter-bar";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface TransactionWithRelations {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  source: string;
  created_at: string;
  accounts: { name: string } | null;
  categories: { name: string; icon: string; color: string } | null;
}

interface MonthOption {
  key: string;
  label: string;
}

export function TransactionsList({
  initialTransactions,
  accounts,
  categories,
  monthOptions,
}: {
  initialTransactions: TransactionWithRelations[];
  accounts: Account[];
  categories: Category[];
  monthOptions: MonthOption[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Calculate date range from period filter
  const getDateRange = (period: string, customStart?: string, customEnd?: string) => {
    const now = new Date();

    if (period === "current") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }

    if (period === "last") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }

    if (period === "custom" && customStart && customEnd) {
      return {
        startDate: customStart,
        endDate: customEnd,
      };
    }

    // Specific month (format: "2026-03")
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }

    return { startDate: undefined, endDate: undefined };
  };

  // Handle filter change
  const handleFilterChange = async (filters: FilterState) => {
    setIsLoading(true);

    const { startDate, endDate } = getDateRange(
      filters.period,
      filters.customStartDate,
      filters.customEndDate
    );

    const data = await getTransactions({
      type: filters.type,
      search: filters.search || undefined,
      startDate,
      endDate,
      categoryId: filters.categoryIds,
      accountId: filters.accountIds,
    });

    setTransactions(data as TransactionWithRelations[]);
    setIsLoading(false);
  };

  async function handleCreate(formData: FormData) {
    const result = await createTransaction(formData);
    if (result?.error) {
      toast.error(result.error, { closeButton: true });
      return;
    }
    setDialogOpen(false);
    toast.success("Transaksi berhasil ditambahkan", { duration: 1500 });
    router.refresh();
  }

  async function handleDelete(id: string) {
    toast("Hapus transaksi ini?", {
      closeButton: true,
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        actionButton:
          "!bg-destructive hover:!bg-destructive/90 !text-white font-medium px-4",
        cancelButton:
          "!bg-secondary hover:!bg-secondary/80 !text-secondary-foreground font-medium px-4",
      },
      action: {
        label: "Hapus",
        onClick: async () => {
          const result = await deleteTransaction(id);
          if (result?.error) {
            toast.error(result.error, { closeButton: true });
            return;
          }
          toast.success("Transaksi berhasil dihapus", { duration: 1500 });
          router.refresh();
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  }

  return (
    <>
      {/* Filter Bar */}
      <FilterBar
        accounts={accounts}
        categories={categories}
        monthOptions={monthOptions}
        onFilterChange={handleFilterChange}
        onAddClick={() => setDialogOpen(true)}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4 text-muted-foreground">
          Memuat data...
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-2">
        {!isLoading && transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                  style={{
                    backgroundColor: transaction.categories
                      ? `${transaction.categories.color}20`
                      : transaction.type === "income"
                        ? "#10B98120"
                        : "#EF444420",
                  }}
                >
                  {transaction.categories?.icon ||
                    (transaction.type === "income" ? "💰" : "💸")}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {transaction.categories?.name ||
                      (transaction.type === "income"
                        ? "Pemasukan"
                        : "Pengeluaran")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.description || "Tidak ada catatan"}
                    {transaction.accounts && ` · ${transaction.accounts.name}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <FormattedCurrency
                    amount={Number(transaction.amount)}
                    showSign
                    sign={transaction.type === "income" ? "+" : "-"}
                    className={`font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(transaction.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && transactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ReceiptText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              Tidak ada transaksi yang cocok atau ditemukan.
            </p>
          </div>
        )}
      </div>

      <TransactionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}
