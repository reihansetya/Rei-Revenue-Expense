"use client";

import { useState } from "react";
import { Account, Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ReceiptText, Search } from "lucide-react";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import { createTransaction, deleteTransaction } from "./actions";
import { TransactionFormDialog } from "./transaction-form-dialog";
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

export function TransactionsList({
  initialTransactions,
  accounts,
  categories,
}: {
  initialTransactions: TransactionWithRelations[];
  accounts: Account[];
  categories: Category[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const router = useRouter();

  const filteredTransactions = initialTransactions.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "income", "expense"].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {type === "all"
                ? "Semua"
                : type === "income"
                  ? "Pemasukan"
                  : "Pengeluaran"}
            </Button>
          ))}
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.map((transaction) => (
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

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ReceiptText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {searchQuery || typeFilter !== "all"
                ? "Tidak ada transaksi yang cocok"
                : "Belum ada transaksi. Tambahkan yang pertama!"}
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
