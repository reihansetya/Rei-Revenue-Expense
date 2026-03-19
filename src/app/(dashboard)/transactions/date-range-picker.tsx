"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  onApply: (start: string, end: string) => void;
  onClose: () => void;
}

export function DateRangePicker({ onApply, onClose }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const handleSelectStart = (date: Date | undefined) => {
    setStartDate(date);
    setStartOpen(false); // tutup popover setelah pilih
    // Kalau tanggal akhir sudah dipilih tapi lebih kecil dari tanggal mulai, reset
    if (date && endDate && endDate < date) {
      setEndDate(undefined);
    }
    // Buka popover tanggal akhir secara otomatis
    if (date) {
      setTimeout(() => setEndOpen(true), 100);
    }
  };

  const handleSelectEnd = (date: Date | undefined) => {
    setEndDate(date);
    setEndOpen(false); // tutup popover setelah pilih
  };

  const handleApply = () => {
    if (startDate && endDate) {
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");
      onApply(start, end);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border rounded-xl mt-3 shadow-md animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <CalendarIcon className="h-3.5 w-3.5" />
          Tentukan Rentang Tanggal
        </label>
        
        <div className="flex items-center gap-2 w-full max-w-lg">
          {/* Tanggal Mulai */}
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger 
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "flex-1 justify-start text-left font-normal bg-background/50",
                !startDate && "text-muted-foreground"
              )}
            >
              {startDate
                ? format(startDate, "dd MMM yyyy", { locale: localeId })
                : "Tanggal Mulai"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleSelectStart}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

          {/* Tanggal Akhir */}
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger 
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "flex-1 justify-start text-left font-normal bg-background/50",
                !endDate && "text-muted-foreground"
              )}
            >
              {endDate
                ? format(endDate, "dd MMM yyyy", { locale: localeId })
                : "Tanggal Akhir"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleSelectEnd}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t mt-1">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
          Batal
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          disabled={!startDate || !endDate}
          className="bg-primary hover:bg-primary/90 px-6"
        >
          Terapkan Filter
        </Button>
      </div>
    </div>
  );
}
