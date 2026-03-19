import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/app/(dashboard)/actions";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const dashboardKeys = {
  all: ["dashboard"] as const,
  byMonth: (month?: string) => ["dashboard", month ?? "current"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboard(month?: string) {
  return useQuery({
    queryKey: dashboardKeys.byMonth(month),
    queryFn: () => getDashboardData(month),
    staleTime: 60 * 1000, // 1 menit
  });
}
