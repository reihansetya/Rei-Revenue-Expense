"use client";

import { useState } from "react";
import { Account } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Wallet, Building2, Smartphone, PiggyBank, Banknote } from "lucide-react";
import { createAccount, updateAccount, deleteAccount } from "./actions";
import { AccountFormDialog } from "./account-form-dialog";
import { useRouter } from "next/navigation";

const accountTypeIcons: Record<string, React.ReactNode> = {
  bank: <Building2 className="h-5 w-5" />,
  ewallet: <Smartphone className="h-5 w-5" />,
  cash: <Banknote className="h-5 w-5" />,
  investment: <PiggyBank className="h-5 w-5" />,
};

const accountTypeLabels: Record<string, string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  cash: "Cash",
  investment: "Investment",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AccountsList({ initialAccounts }: { initialAccounts: Account[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const router = useRouter();

  const totalBalance = initialAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  async function handleCreate(formData: FormData) {
    const result = await createAccount(formData);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!editingAccount) return;
    const result = await updateAccount(editingAccount.id, formData);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setEditingAccount(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus akun ini?")) return;
    const result = await deleteAccount(id);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
  }

  return (
    <>
      {/* Total Balance Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Saldo</p>
            <p className="text-3xl font-bold">{formatRupiah(totalBalance)}</p>
          </div>
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{initialAccounts.length} akun terdaftar</p>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Akun
        </Button>
      </div>

      {/* Account Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialAccounts.map((account) => (
          <Card key={account.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div
                className="h-2"
                style={{ backgroundColor: account.color }}
              />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${account.color}20`, color: account.color }}
                    >
                      {accountTypeIcons[account.type] || <Wallet className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{accountTypeLabels[account.type]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
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
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatRupiah(Number(account.balance))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {initialAccounts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada akun. Tambahkan akun pertama Anda!</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AccountFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        title="Tambah Akun Baru"
      />

      {editingAccount && (
        <AccountFormDialog
          open={!!editingAccount}
          onClose={() => setEditingAccount(null)}
          onSubmit={handleUpdate}
          title="Edit Akun"
          defaultValues={editingAccount}
        />
      )}
    </>
  );
}
