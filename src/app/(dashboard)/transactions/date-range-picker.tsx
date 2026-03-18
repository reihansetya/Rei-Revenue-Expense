"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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

  const handleApply = () => {
    if (startDate && endDate) {
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");
      onApply(start, end);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 border rounded-lg mt-2 text-sm w-full">
      <span className="font-medium text-muted-foreground">Pilih Tanggal:</span>
      
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger 
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-40 justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate
              ? format(startDate, "dd MMM yyyy", { locale: localeId })
              : "Dari"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">-</span>

        <Popover>
          <PopoverTrigger 
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-40 justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate
              ? format(endDate, "dd MMM yyyy", { locale: localeId })
              : "Sampai"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              disabled={(date) => startDate ? date < startDate : false}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Batal
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          disabled={!startDate || !endDate}
        >
          Terapkan
        </Button>
      </div>
    </div>
  );
}
