import { getTransactions, getAvailableMonths } from "./actions";
import { getAccounts } from "../accounts/actions";
import { getCategories } from "../categories/actions";
import { TransactionsList } from "./transactions-list";

export default async function TransactionsPage() {
  const [transactions, accounts, categories, monthOptions] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
    getAvailableMonths(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
      </div>
      <TransactionsList
        initialTransactions={transactions}
        accounts={accounts}
        categories={categories}
        monthOptions={monthOptions}
      />
    </div>
  );
}
