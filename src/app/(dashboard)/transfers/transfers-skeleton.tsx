import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TransfersSkeleton() {
  return (
    <div className="flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Transfer List */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            {/* Account Flow Row */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {/* From Account */}
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="min-w-0">
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>

              {/* Center: Amount + Arrow */}
              <div className="flex flex-col items-center gap-0.5 px-1 shrink-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>

              {/* To Account */}
              <div className="flex items-center gap-2 min-w-0 justify-end">
                <div className="min-w-0 text-right">
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 gap-2">
              <div className="min-w-0">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
