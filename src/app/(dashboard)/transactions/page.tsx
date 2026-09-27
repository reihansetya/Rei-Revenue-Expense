import { format, startOfMonth, endOfMonth } from "date-fns";
import { todayWIB } from "@/lib/utils";
import { getAvailableMonths, getTransactions } from "./actions";
import { getAccounts } from "../accounts/actions";
import { getCategories } from "../categories/actions";
import { TransactionsList } from "./transactions-list";

export default async function TransactionsPage() {
  // Fetch data statis (accounts, categories, monthOptions) di server
  // Transactions di-fetch client-side via TanStack Query untuk caching
  // Initial list for the default filter (current month) is fetched here too,
  // so the client does not wait for hydration + a second server round trip.
  // Must match the browser's "current month" filter, which is on WIB time
  const now = new Date(todayWIB());
  const [accounts, categories, monthOptions, initialTransactions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getAvailableMonths(),
    getTransactions({
      startDate: format(startOfMonth(now), "yyyy-MM-dd"),
      endDate: format(endOfMonth(now), "yyyy-MM-dd"),
    }),
  ]);

  return (
    <div className="flex flex-col gap-4 w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
      </div>
      <TransactionsList
        accounts={accounts}
        categories={categories}
        monthOptions={monthOptions}
        initialTransactions={initialTransactions}
      />
    </div>
  );
}
