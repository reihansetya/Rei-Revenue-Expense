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
import { Settings, Tags, LogOut, User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* Mobile: Logo on left (no hamburger) */}
      <Link
        href="/"
        className="md:hidden flex items-center gap-2 font-semibold"
      >
        <span className="text-sm">Expense Tracker</span>
      </Link>

      <div className="flex items-center gap-4 ml-auto">
        <HideNominalToggle />
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-9 w-9 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
            <User className="h-4 w-4" />
            <span className="sr-only">User menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <div className="px-2 py-1.5 text-sm font-semibold">Menu</div>
              <DropdownMenuSeparator />
              {/* Mobile only: Categories & Settings */}
              <DropdownMenuItem className="md:hidden">
                <Link href="/categories" className="flex items-center w-full">
                  <Tags className="mr-2 h-4 w-4" />
                  Kategori
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden">
                <Link href="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Pengaturan
                </Link>
              </DropdownMenuItem>
              {/* Desktop: Settings only (Categories in sidebar) */}
              <DropdownMenuItem className="hidden md:flex">
                <Link href="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Pengaturan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
