"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ReceiptText,
  Wallet,
  ArrowRightLeft,
  TrendingUp,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Transaksi", href: "/transactions", icon: ReceiptText },
  { name: "Dompet", href: "/accounts", icon: Wallet, featured: true },
  { name: "Transfer", href: "/transfers", icon: ArrowRightLeft },
  { name: "Investasi", href: "/investments", icon: TrendingUp },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center pointer-events-none">
      <div className="relative w-full max-w-md mx-4 mb-4 pointer-events-auto">
        {/* Floating bar */}
        <div className="flex items-center justify-around h-16 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/10 dark:shadow-black/30">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            if (item.featured) {
              // Placeholder space for the featured button
              return <div key={item.href} className="flex-1" />;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span
                  className={cn("text-[10px]", isActive && "font-semibold")}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Featured Dompet button - floating above */}
        {(() => {
          const featured = navigation.find((n) => n.featured)!;
          const isActive = pathname === featured.href;
          return (
            <Link
              href={featured.href}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 -top-4 flex flex-col items-center gap-0.5 transition-all",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-14 w-14 rounded-full shadow-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-primary/30 scale-110"
                    : "bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-primary/25 hover:scale-105",
                )}
              >
                <featured.icon className="h-6 w-6" />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {featured.name}
              </span>
            </Link>
          );
        })()}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
