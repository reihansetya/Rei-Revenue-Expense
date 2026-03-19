"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowRight,
  Trash2,
  Wallet,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { deleteTransfer } from "./actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FormattedCurrency } from "@/components/ui/formatted-currency";
import type { Transfer } from "@/types";

interface TransfersListProps {
  transfers: Transfer[];
}

// Icon mapping berdasarkan tipe akun
const accountIcons = {
  bank: CreditCard,
  ewallet: Wallet,
  cash: Banknote,
  investment: TrendingUp,
};

function TransferTypeBadge({ type }: { type?: string }) {
  if (!type || type === "regular") return null;
  if (type === "investment") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
        <TrendingUp className="h-3 w-3" />
        Beli Investasi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
      <TrendingDown className="h-3 w-3" />
      Cairkan Investasi
    </span>
  );
}

export function TransfersList({ transfers }: TransfersListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function handleDelete(transferId: string) {
    setIsDeleting(transferId);
    await deleteTransfer(transferId);
    setIsDeleting(null);
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowRight className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Belum ada transfer. Klik tombol <code>Transfer Baru</code> untuk
          memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transfers.map((transfer) => {
        const FromIcon = accountIcons[transfer.from_account?.type || "bank"];
        const ToIcon = accountIcons[transfer.to_account?.type || "bank"];

        return (
          <div
            key={transfer.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* === Account Flow Row: selalu 3 kolom, tidak pernah wrap === */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {/* From Account */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      (transfer.from_account?.color || "#555") + "20",
                  }}
                >
                  <FromIcon
                    className="h-4 w-4"
                    style={{ color: transfer.from_account?.color || "#555" }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {transfer.from_account?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sumber
                  </p>
                </div>
              </div>

              {/* Center: Amount + Arrow */}
              <div className="flex flex-col items-center gap-0.5 px-1 shrink-0">
                <FormattedCurrency
                  amount={transfer.amount}
                  className="font-semibold text-xs text-red-600 dark:text-red-400 text-center whitespace-nowrap"
                />
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </div>

              {/* To Account */}
              <div className="flex items-center gap-2 min-w-0 justify-end">
                <div className="min-w-0 text-right">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {transfer.to_account?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tujuan
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      (transfer.to_account?.color || "#555") + "20",
                  }}
                >
                  <ToIcon
                    className="h-4 w-4"
                    style={{ color: transfer.to_account?.color || "#555" }}
                  />
                </div>
              </div>
            </div>

            {/* === Bottom Row: Tanggal, Deskripsi, Badge, Delete === */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 gap-2">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {format(new Date(transfer.date), "d MMMM yyyy", {
                    locale: id,
                  })}
                </p>
                {transfer.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-48">
                    {transfer.description}
                  </p>
                )}
                <TransferTypeBadge type={transfer.transfer_type} />
              </div>

              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-600 shrink-0"
                    />
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Transfer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan mengembalikan saldo transaksi ke kedua
                      dompet. Transfer senilai{" "}
                      <FormattedCurrency amount={transfer.amount} /> akan
                      dihapus permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(transfer.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={isDeleting === transfer.id}
                    >
                      {isDeleting === transfer.id ? "Menghapus..." : "Hapus"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

        );
      })}
    </div>
  );
}
