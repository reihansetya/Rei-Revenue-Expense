"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHideNominal } from "@/components/providers/hide-nominal-provider";

interface HideNominalToggleProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function HideNominalToggle({
  variant = "ghost",
  size = "icon",
  showLabel = false,
}: HideNominalToggleProps) {
  const { isHidden, toggle } = useHideNominal();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant={variant}
              size={size}
              onClick={toggle}
              aria-label={
                isHidden ? "Tampilkan nominal" : "Sembunyikan nominal"
              }
            >
              {isHidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showLabel && (
                <span className="ml-2">
                  {isHidden ? "Tampilkan" : "Sembunyikan"}
                </span>
              )}
            </Button>
          }
        />
        <TooltipContent>
          <p>{isHidden ? "Tampilkan nominal" : "Sembunyikan nominal"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
