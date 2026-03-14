"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Home,
  ReceiptText,
  CreditCard,
  Tags,
  Settings,
  ArrowRightLeft,
} from "lucide-react";
import { PWAManualInstall } from "../pwa-manual-install";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Transaksi", href: "/transactions", icon: ReceiptText },
  { name: "Transfer", href: "/transfers", icon: ArrowRightLeft },
  { name: "Dompet", href: "/accounts", icon: CreditCard },
  { name: "Kategori", href: "/categories", icon: Tags },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-muted/20 md:block w-64 h-screen shrink-0 sticky top-0">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="">Expense Tracker</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    isActive
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:text-primary hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <PWAManualInstall />
      </div>
    </div>
  );
}
