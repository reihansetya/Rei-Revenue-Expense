import { getAccounts } from "./actions";
import { AccountsList } from "./accounts-list";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Akun</h1>
      </div>
      <AccountsList initialAccounts={accounts} />
    </div>
  );
}
