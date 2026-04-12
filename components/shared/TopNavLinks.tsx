"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/fleet", label: "Fleet" },
  { href: "/timeline", label: "Timeline" },
  { href: "/ask", label: "Ask" },
  { href: "/settings", label: "Settings" },
];

export function TopNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden lg:flex gap-6" aria-label="Main navigation">
      {links.map(({ href, label }) => (
        <Link
          key={href + label}
          href={href}
          className={cn(
            "text-sm transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === href || pathname.startsWith(href + "/")
              ? "text-primary font-medium"
              : "text-secondary-foreground hover:text-primary",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
