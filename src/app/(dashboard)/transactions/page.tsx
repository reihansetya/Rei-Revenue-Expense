import { getAvailableMonths } from "./actions";
import { getAccounts } from "../accounts/actions";
import { getCategories } from "../categories/actions";
import { TransactionsList } from "./transactions-list";

export default async function TransactionsPage() {
  // Fetch data statis (accounts, categories, monthOptions) di server
  // Transactions di-fetch client-side via TanStack Query untuk caching
  const [accounts, categories, monthOptions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getAvailableMonths(),
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
      />
    </div>
  );
}
