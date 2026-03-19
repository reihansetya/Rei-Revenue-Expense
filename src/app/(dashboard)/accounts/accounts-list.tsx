"use client";

import { useState } from "react";
import { Account } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { AccountFormDialog } from "./account-form-dialog";
import { UpdateBalanceDialog } from "./update-balance-dialog";
import { toast } from "sonner";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import {
  useAccounts,
  useDeleteAccount,
  useUpdateInvestmentBalance,
  useCreateAccount,
  useUpdateAccount,
} from "@/queries/accounts";

const accountTypeIcons: Record<string, React.ReactNode> = {
  bank: <Building2 className="h-5 w-5" />,
  ewallet: <Smartphone className="h-5 w-5" />,
  cash: <Banknote className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
};

const accountTypeLabels: Record<string, string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  cash: "Cash",
  investment: "Investasi",
};

type FilterType = "all" | "wallet" | "investment";

export function AccountsList({
  initialAccounts,
}: {
  initialAccounts: Account[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [updateBalanceAccount, setUpdateBalanceAccount] =
    useState<Account | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  // TanStack Query — gunakan initialAccounts sebagai data awal (SSR hydration)
  const { data: accounts = initialAccounts } = useAccounts();
  const deleteMutation = useDeleteAccount();
  const updateBalanceMutation = useUpdateInvestmentBalance();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();

  const sortedAccounts = [...accounts].sort(
    (a, b) => Number(b.balance) - Number(a.balance),
  );
  const totalBalance = sortedAccounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0,
  );
  const walletAccounts = sortedAccounts.filter((a) => a.type !== "investment");
  const investmentAccounts = sortedAccounts.filter(
    (a) => a.type === "investment",
  );
  const walletBalance = walletAccounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );
  const investmentBalance = investmentAccounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );

  const displayedAccounts =
    filter === "wallet"
      ? walletAccounts
      : filter === "investment"
        ? investmentAccounts
        : sortedAccounts;

  async function handleCreate(formData: FormData) {
    const rawBalance = formData.get("balance") as string;
    if (rawBalance) formData.set("balance", rawBalance.replace(/\./g, ""));

    return new Promise<void>((resolve) => {
      createAccountMutation.mutate(formData, {
        onSuccess: () => {
          setDialogOpen(false);
          resolve();
        },
        onError: (error) => {
          toast.error(error.message || "Gagal menambahkan dompet", {
            closeButton: true,
          });
          resolve();
        },
      });
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editingAccount) return;

    return new Promise<void>((resolve) => {
      updateAccountMutation.mutate(
        { id: editingAccount.id!, formData },
        {
          onSuccess: () => {
            setEditingAccount(null);
            resolve();
          },
          onError: (error) => {
            toast.error(error.message || "Gagal mengupdate dompet", {
              closeButton: true,
            });
            resolve();
          },
        },
      );
    });
  }

  function handleDelete(id: string) {
    toast("Hapus dompet ini?", {
      action: {
        label: "Hapus",
        onClick: () => {
          deleteMutation.mutate(id ?? "");
        },
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  }

  async function handleUpdateBalance(
    accountId: string,
    newBalance: number,
    notes: string,
  ) {
    return new Promise<void>((resolve) => {
      updateBalanceMutation.mutate(
        { accountId, newBalance, notes: notes || undefined },
        {
          onSuccess: () => {
            setUpdateBalanceAccount(null);
            resolve();
          },
          onError: () => resolve(),
        },
      );
    });
  }

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "wallet", label: "Dompet" },
    { key: "investment", label: "Investasi" },
  ];

  return (
    <>
      {/* Balance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Saldo</p>
              <FormattedCurrency
                amount={totalBalance}
                className="text-2xl font-bold"
              />
            </div>
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Dompet</p>
              <FormattedCurrency
                amount={walletBalance}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-muted-foreground">
                {walletAccounts.length} E-Wallet
              </p>
            </div>
            <Wallet className="h-8 w-8 text-blue-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Investasi</p>
              <FormattedCurrency
                amount={investmentBalance}
                className="text-2xl font-bold text-purple-600"
              />
              <p className="text-xs text-muted-foreground">
                {investmentAccounts.length} Investasi
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400" />
          </CardContent>
        </Card>
      </div>

      {/* Header + Filter + Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Dompet
        </Button>
      </div>

      {/* Account Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedAccounts.map((account) => (
          <Card key={account.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-2" style={{ backgroundColor: account.color }} />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${account.color}20`,
                        color: account.color,
                      }}
                    >
                      {accountTypeIcons[account.type] || (
                        <Wallet className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {accountTypeLabels[account.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {account.type === "investment" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-purple-500 hover:text-purple-700"
                        onClick={() => setUpdateBalanceAccount(account)}
                        title="Update Saldo"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingAccount(account)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(account.id ?? "")}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <FormattedCurrency
                    amount={Number(account.balance)}
                    className="text-2xl font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {displayedAccounts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada dompet. Tambahkan dompet pertama Anda!</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AccountFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        title="Tambah Dompet Baru"
      />

      {editingAccount && (
        <AccountFormDialog
          open={!!editingAccount}
          onClose={() => setEditingAccount(null)}
          onSubmit={handleUpdate}
          title="Ubah Dompet"
          defaultValues={editingAccount}
        />
      )}

      <UpdateBalanceDialog
        open={!!updateBalanceAccount}
        account={updateBalanceAccount}
        onClose={() => setUpdateBalanceAccount(null)}
        onUpdate={handleUpdateBalance}
      />
    </>
  );
}
