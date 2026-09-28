"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TransactionFormDialog } from "@/app/(dashboard)/transactions/transaction-form-dialog";
import { useAccounts } from "@/queries/accounts";
import { useCategories } from "@/queries/categories";

// Floating "+" to record a transaction from any dashboard page.
// Mobile: just above the bottom nav (which keeps Dompet in the center).
export function QuickAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Catat transaksi"
        className="fixed right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>
      {open && <QuickAddDialog onClose={() => setOpen(false)} />}
    </>
  );
}

// Mounted only while open, so accounts/categories are fetched on first use
// and served from the React Query cache afterwards
function QuickAddDialog({ onClose }: { onClose: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  return (
    <TransactionFormDialog
      open
      onClose={onClose}
      accounts={accounts}
      categories={categories}
    />
  );
}
