// src/components/layout/header.tsx
"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { HideNominalToggle } from "@/components/ui/hide-nominal-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/(auth)/actions";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <MobileNav />

      <div className="flex items-center gap-4 ml-auto">
        <HideNominalToggle />
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center rounded-full h-9 w-9 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer overflow-hidden"
          >
            <span className="text-sm font-medium">U</span>
            <span className="sr-only">Toggle user menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <div className="px-2 py-1.5 text-sm font-semibold">My Account</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/settings" className="w-full">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}