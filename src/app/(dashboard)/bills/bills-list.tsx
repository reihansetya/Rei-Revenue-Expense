"use client";

import { useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import { CalendarClock, MoreVertical, Pencil, Plus, SkipForward, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn, todayWIB } from "@/lib/utils";
import { daysUntil, dueLabel, formatDueDate, intervalLabel, unpaidUntil } from "@/lib/bills";
import { useBills, useCreateBill, useUpdateBill, useDeleteBill, usePayBill } from "@/queries/bills";
import { useAccounts } from "@/queries/accounts";
import { useCategories } from "@/queries/categories";
import { BillFormDialog } from "./bill-form-dialog";
import { PayBillDialog } from "./pay-bill-dialog";

function monthEnd(today: string) {
  const [year, month] = today.split("-").map(Number);
  return `${today.slice(0, 7)}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

export function BillsList({ initialBills }: { initialBills: Bill[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  const { data: bills = initialBills } = useBills(initialBills);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateBill();
  const updateMutation = useUpdateBill();
  const deleteMutation = useDeleteBill();
  const payMutation = usePayBill();

  const today = todayWIB();
  const endOfMonth = monthEnd(today);
  const unpaidThisMonth = bills.reduce((sum, b) => sum + unpaidUntil(b, endOfMonth), 0);
  const paidThisMonth = bills.reduce(
    (sum, b) =>
      sum + (b.bill_payments ?? []).reduce((s, p) => s + Number(p.transactions?.amount ?? 0), 0),
    0,
  );

  // Errors are toasted by the mutation hooks; the dialog just stays open
  async function handleCreate(formData: FormData) {
    await createMutation.mutateAsync(formData).then(() => setFormOpen(false), () => {});
  }

  async function handleUpdate(formData: FormData) {
    if (!editingBill) return;
    await updateMutation
      .mutateAsync({ id: editingBill.id, formData })
      .then(() => setEditingBill(null), () => {});
  }

  function handleSkip(bill: Bill) {
    toast(`Lewati periode ${formatDueDate(bill.next_due_date)}?`, {
      description: "Tandai sudah beres tanpa mencatat transaksi.",
      action: {
        label: "Lewati",
        onClick: () => payMutation.mutate({ id: bill.id, dueDate: bill.next_due_date, skip: true }),
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  }

  function handleDelete(bill: Bill) {
    toast(`Hapus tagihan ${bill.name}?`, {
      description: "Transaksi pembayaran sebelumnya tetap tersimpan.",
      action: { label: "Hapus", onClick: () => deleteMutation.mutate(bill.id) },
      cancel: { label: "Batal", onClick: () => {} },
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Tagihan
        </Button>
      </div>

      {bills.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Belum dibayar bulan ini</p>
              <FormattedCurrency amount={unpaidThisMonth} className="text-lg font-semibold text-rose-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Sudah dibayar bulan ini</p>
              <FormattedCurrency amount={paidThisMonth} className="text-lg font-semibold text-emerald-500" />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-2">
        {bills.map((bill) => {
          const days = daysUntil(bill.next_due_date, today);
          const paidThisPeriod = (bill.bill_payments ?? []).length > 0 && days > 3;
          return (
            <Card key={bill.id}>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {bill.categories?.icon} {bill.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <FormattedCurrency amount={Number(bill.amount)} /> ·{" "}
                    {intervalLabel(bill.interval_unit, bill.interval_count)}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      days < 0 ? "text-rose-500 font-medium" : days <= 3 ? "text-amber-500 font-medium" : "text-muted-foreground",
                    )}
                  >
                    {paidThisPeriod && <span className="text-emerald-500">✓ Lunas · </span>}
                    {days <= 7 ? `${dueLabel(days)} · ` : "Berikutnya "}
                    {formatDueDate(bill.next_due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant={days <= 3 ? "default" : "outline"}
                    onClick={() => setPayingBill(bill)}
                  >
                    Bayar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted cursor-pointer">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Menu tagihan</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setEditingBill(bill)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip(bill)}>
                        <SkipForward className="mr-2 h-4 w-4" />
                        Lewati periode
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(bill)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {bills.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Belum ada tagihan. Tambahkan tagihan rutin seperti kontrakan atau listrik.</p>
        </div>
      )}

      {formOpen && (
        <BillFormDialog
          open
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreate}
          title="Tambah Tagihan"
          accounts={accounts}
          categories={categories}
        />
      )}

      {editingBill && (
        <BillFormDialog
          open
          onClose={() => setEditingBill(null)}
          onSubmit={handleUpdate}
          title="Edit Tagihan"
          defaultValues={editingBill}
          accounts={accounts}
          categories={categories}
        />
      )}

      {payingBill && (
        <PayBillDialog bill={payingBill} accounts={accounts} onClose={() => setPayingBill(null)} />
      )}
    </>
  );
}
