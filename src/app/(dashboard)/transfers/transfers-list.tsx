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
import {
  FormattedCurrency,
} from "@/components/ui/formatted-currency";
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Account Flow */}
              <div className="flex flex-1 flex-wrap md:flex-nowrap items-center justify-between md:justify-start gap-2 sm:gap-4 md:gap-6 lg:gap-8 min-w-0 w-full md:w-auto">
                {/* From Account */}
                <div
                  className="flex items-center gap-2 min-w-0"
                  style={{ flexBasis: "40%" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor:
                        (transfer.from_account?.color || "#555") + "20",
                    }}
                  >
                    <FromIcon
                      className="h-5 w-5"
                      style={{ color: transfer.from_account?.color || "#555" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {transfer.from_account?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sumber
                    </p>
                  </div>
                </div>

                {/* Arrow & Amount (Mobile Responsive) */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
                  <FormattedCurrency
                    amount={transfer.amount}
                    className="font-semibold text-sm md:text-base text-red-600 dark:text-red-400 text-center"
                  />
                </div>

                {/* To Account */}
                <div
                  className="flex items-center gap-2 min-w-0"
                  style={{ flexBasis: "40%" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor:
                        (transfer.to_account?.color || "#555") + "20",
                    }}
                  >
                    <ToIcon
                      className="h-5 w-5"
                      style={{ color: transfer.to_account?.color || "#555" }}
                    />
                  </div>
                  <div className="min-w-0 overflow-hidden text-right md:text-left">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {transfer.to_account?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tujuan
                    </p>
                  </div>
                </div>
              </div>

              {/* Date & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0 pt-2 border-t md:border-none border-gray-100 dark:border-gray-800">
                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(transfer.date), "d MMMM yyyy", {
                      locale: id,
                    })}
                  </p>
                  {transfer.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-37.5">
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
                        className="text-gray-400 hover:text-red-600"
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
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting === transfer.id}
                      >
                        {isDeleting === transfer.id ? "Menghapus..." : "Hapus"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
