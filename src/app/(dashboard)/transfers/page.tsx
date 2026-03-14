import { getTransfers } from "./actions";
import { getAccounts } from "../accounts/actions";
import { TransfersList } from "./transfers-list";
import { TransferFormDialog } from "./transfer-form-dialog";
import { ArrowLeftRight } from "lucide-react";

export default async function TransfersPage() {
  const [transfers, accounts] = await Promise.all([
    getTransfers(),
    getAccounts(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transfer Antar Akun
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Pindahkan saldo antar akun yang Anda miliki
          </p>
        </div>
        <TransferFormDialog accounts={accounts} />
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium text-base">Tentang Transfer</p>
            <p className="mt-1 opacity-90 leading-relaxed">
              Transfer antar akun **tidak tercatat sebagai pemasukan atau 
              pengeluaran.** Total saldo Anda tetap sama, uang Anda hanya berpindah 
              "dompet/kantung".
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <TransfersList transfers={transfers} />
    </div>
  );
}
