import { getAccounts } from "./actions";
import { AccountsList } from "./accounts-list";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Dompet</h1>
          <p className="text-gray-500 mt-1">
            Daftar semua dompet keuangan Anda
          </p>
        </div>
      </div>
      <AccountsList initialAccounts={accounts} />
    </div>
  );
}
