"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar, Check, ChevronDown } from "lucide-react";
import { Account, Category } from "@/types";
import { DateRangePicker } from "./date-range-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthOption {
  key: string;
  label: string;
}

interface FilterBarProps {
  accounts: Account[];
  categories: Category[];
  monthOptions: MonthOption[];
  onFilterChange: (filters: FilterState) => void;
  onAddClick: () => void;
}

export interface FilterState {
  search: string;
  type: string;
  categoryIds: string[];
  accountIds: string[];
  period: string;
  customStartDate?: string;
  customEndDate?: string;
}

const DEBOUNCE_DELAY = 300;

export function FilterBar({
  accounts,
  categories,
  monthOptions,
  onFilterChange,
  onAddClick,
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "all",
    categoryIds: [],
    accountIds: [],
    period: "current",
  });

  const [showCustomRange, setShowCustomRange] = useState(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onFilterChangeRef = useRef(onFilterChange);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const debouncedFilterChange = useCallback(
    (newFilters: FilterState, shouldDebounce: boolean = false) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (shouldDebounce) {
        debounceTimeoutRef.current = setTimeout(() => {
          onFilterChangeRef.current(newFilters);
        }, DEBOUNCE_DELAY);
      } else {
        onFilterChangeRef.current(newFilters);
      }
    },
    [],
  );

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
    shouldDebounce: boolean = false,
  ) => {
    const newFilters = { ...filters, [key]: value };

    if (key === "type") {
      newFilters.categoryIds = [];
    }

    if (key === "period" && (value as string) !== "custom") {
      newFilters.customStartDate = undefined;
      newFilters.customEndDate = undefined;
      setShowCustomRange(false);
    }

    if (key === "period" && (value as string) === "custom") {
      setShowCustomRange(true);
    }

    setFilters(newFilters);
    debouncedFilterChange(newFilters, shouldDebounce);
  };

  const toggleMultiSelect = (key: "categoryIds" | "accountIds", id: string) => {
    const current = filters[key];
    const exists = current.includes(id);
    const updated = exists ? current.filter((i) => i !== id) : [...current, id];
    updateFilter(key, updated);
  };

  const handleCustomDateApply = (start: string, end: string) => {
    const newFilters = {
      ...filters,
      customStartDate: start,
      customEndDate: end,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setShowCustomRange(false);
  };

  const getLabel = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    if (key === "type") {
      if ((value as string) === "all") return "Semua";
      return (value as string) === "income" ? "Pemasukan" : "Pengeluaran";
    }

    if (key === "categoryIds") {
      const v = value as string[];
      if (!v || v.length === 0) return "Semua";
      if (v.length === 1) {
        const c = categories.find((cat) => cat.id === v[0]);
        return c ? `${c.icon} ${c.name}` : v[0];
      }
      return `${v.length} Terpilih`;
    }

    if (key === "accountIds") {
      const v = value as string[];
      if (!v || v.length === 0) return "Semua";
      if (v.length === 1) {
        const a = accounts.find((acc) => acc.id === v[0]);
        return a ? a.name : v[0];
      }
      return `${v.length} Terpilih`;
    }

    if (key === "period") {
      const v = value as string;
      if (v === "current") return "Bulan Ini";
      if (v === "last") return "Bulan Lalu";
      if (v === "custom") return "Custom";
      const m = monthOptions.find((month) => month.key === v);
      return m ? m.label : v;
    }
    return value?.toString() || "";
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari transaksi..."
          className="pl-10"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value, true)}
        />
      </div>

      {/* Filter Row + Tambah Button */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type Filter */}
        <Select
          value={filters.type}
          onValueChange={(v) => updateFilter("type", v || "all")}
        >
          <SelectTrigger className="h-9 text-sm">
            <span className="text-muted-foreground mr-1 text-xs">Tipe:</span>
            <SelectValue>{getLabel("type", filters.type)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter (Multi) */}
        <Popover>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "justify-between font-normal",
            )}
          >
            <span className="flex items-center overflow-hidden">
              <span className="text-muted-foreground mr-1 shrink-0">
                Kategori:
              </span>
              <span className="truncate">
                {getLabel("categoryIds", filters.categoryIds)}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-60 p-0" align="start">
            <div className="p-2 space-y-1 max-h-75 overflow-y-auto">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => updateFilter("categoryIds", [])}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    filters.categoryIds.length === 0
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50",
                  )}
                >
                  {filters.categoryIds.length === 0 && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                Semua Kategori
              </Button>

              {(filters.type === "expense" || filters.type === "all") && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 rounded mt-2">
                    ── Pengeluaran ──
                  </div>
                  {expenseCategories.map((c) => (
                    <Button
                      key={c.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start font-normal"
                      onClick={() =>
                        toggleMultiSelect("categoryIds", c.id || "")
                      }
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          filters.categoryIds.includes(c.id || "")
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50",
                        )}
                      >
                        {filters.categoryIds.includes(c.id || "") && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      {c.icon} {c.name}
                    </Button>
                  ))}
                </>
              )}

              {(filters.type === "income" || filters.type === "all") && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 rounded mt-2">
                    ── Pemasukan ──
                  </div>
                  {incomeCategories.map((c) => (
                    <Button
                      key={c.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start font-normal"
                      onClick={() =>
                        toggleMultiSelect("categoryIds", c.id || "")
                      }
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          filters.categoryIds.includes(c.id || "")
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50",
                        )}
                      >
                        {filters.categoryIds.includes(c.id || "") && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      {c.icon} {c.name}
                    </Button>
                  ))}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Account Filter (Multi) */}
        <Popover>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "justify-between font-normal",
            )}
          >
            <span className="flex items-center overflow-hidden">
              <span className="text-muted-foreground mr-1 shrink-0">
                Dompet:
              </span>
              <span className="truncate">
                {getLabel("accountIds", filters.accountIds)}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-45 p-0" align="start">
            <div className="p-2 space-y-1 max-h-75 overflow-y-auto">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => updateFilter("accountIds", [])}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    filters.accountIds.length === 0
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50",
                  )}
                >
                  {filters.accountIds.length === 0 && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                Semua Dompet
              </Button>
              {accounts.map((a) => (
                <Button
                  key={a.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  onClick={() => toggleMultiSelect("accountIds", a.id || "")}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      filters.accountIds.includes(a.id || "")
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50",
                    )}
                  >
                    {filters.accountIds.includes(a.id || "") && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {a.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Period Filter */}
        <Select
          value={filters.period}
          onValueChange={(v) => updateFilter("period", v || "current")}
        >
          <SelectTrigger className="h-9 text-sm">
            <span className="text-muted-foreground mr-1 text-xs">Periode:</span>
            <SelectValue>{getLabel("period", filters.period)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Bulan Ini</SelectItem>
            <SelectItem value="last">Bulan Lalu</SelectItem>
            {monthOptions.slice(2).map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Custom Range
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onAddClick} size="sm" className="ml-auto shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomRange && (
        <DateRangePicker
          onApply={handleCustomDateApply}
          onClose={() => setShowCustomRange(false)}
        />
      )}
    </div>
  );
}
