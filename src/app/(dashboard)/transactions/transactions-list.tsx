"use client";

import { useState } from "react";
import { Account, Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ReceiptText } from "lucide-react";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { FilterBar, FilterState } from "./filter-bar";
import { TransactionsListSkeleton } from "./transactions-skeleton";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useTransactions, useDeleteTransaction, useCreateTransaction } from "@/queries/transactions";

interface MonthOption {
  key: string;
  label: string;
}

export function TransactionsList({
  accounts,
  categories,
  monthOptions,
}: {
  initialTransactions?: never; // kept for backward compat, unused
  accounts: Account[];
  categories: Category[];
  monthOptions: MonthOption[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    search: "",
    type: "all",
    categoryIds: [],
    accountIds: [],
    period: "current",
  });

  const { data: transactions = [], isLoading } = useTransactions(currentFilters);
  const deleteMutation = useDeleteTransaction();
  const createMutation = useCreateTransaction();

  // Handle filter change
  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
  };

  async function handleCreate(formData: FormData): Promise<void> {
    return new Promise((resolve) => {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setDialogOpen(false);
          resolve();
        },
        onError: (error) => {
          toast.error(error.message || "Gagal menambahkan transaksi", { closeButton: true });
          resolve();
        },
      });
    });
  }

  function handleDelete(id: string) {
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
        onClick: () => {
          deleteMutation.mutate(id);
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  }

  return (
    <div className="flex flex-col gap-4 w-full overflow-hidden">
      {/* Filter Bar */}
      <FilterBar
        accounts={accounts}
        categories={categories}
        monthOptions={monthOptions}
        onFilterChange={handleFilterChange}
        onAddClick={() => setDialogOpen(true)}
      />

      {/* Loading State */}
      {isLoading ? (
        <TransactionsListSkeleton count={5} />
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
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
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {transaction.categories?.name ||
                        (transaction.type === "income"
                          ? "Pemasukan"
                          : "Pengeluaran")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {transaction.description || "Tidak ada catatan"}
                      {transaction.accounts && ` · ${transaction.accounts.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {format(new Date(transaction.date), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="text-right">
                    <FormattedCurrency
                      amount={Number(transaction.amount)}
                      showSign
                      sign={transaction.type === "income" ? "+" : "-"}
                      className={`text-sm font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(transaction.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {transactions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ReceiptText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada transaksi yang cocok atau ditemukan.</p>
            </div>
          )}
        </div>
      )}

      <TransactionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
