"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, MessageCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/fleet", label: "Home", icon: Home },
  { href: "/fleet", label: "Fleet", icon: Car }, // Epic 2 will differentiate
  { href: "/ask", label: "Ask", icon: MessageCircle }, // page built in Epic 6
  { href: "/timeline", label: "Docs", icon: FileText }, // page built in Epic 5
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-40"
    >
      <div className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href + label}
              href={href}
              // Home and Fleet both point to /fleet until Epic 2 differentiates them.
              // Both will be aria-current="page" simultaneously on /fleet — intentional, temporary.
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] py-2 text-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
