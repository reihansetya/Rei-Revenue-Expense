import { getBills } from "./actions";
import { BillsList } from "./bills-list";

export default async function BillsPage() {
  const bills = await getBills();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tagihan</h1>
      </div>
      <BillsList initialBills={bills} />
    </div>
  );
}
