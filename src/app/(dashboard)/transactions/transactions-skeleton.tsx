import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TransactionsListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2 overflow-x-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-none shadow-sm">
          <CardContent className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 sm:w-28" />
                <Skeleton className="h-3 w-28 sm:w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-5 w-16 sm:w-24" />
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-6 overflow-hidden max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Search Bar */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Filter Row — Match the responsive grid in FilterBar */}
      <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2">
        <Skeleton className="h-9 w-full lg:w-32" />
        <Skeleton className="h-9 w-full lg:w-60" />
        <Skeleton className="h-9 w-full lg:w-44" />
        <Skeleton className="h-9 w-full lg:w-44" />
      </div>

      {/* Add Button Placeholder */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Transaction List */}
      <TransactionsListSkeleton count={6} />
    </div>
  );
}
