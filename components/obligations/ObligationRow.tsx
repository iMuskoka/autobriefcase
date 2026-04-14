import type { ObligationItem } from "@/lib/obligations";
import { cn } from "@/lib/utils";

interface ObligationRowProps {
  obligation: ObligationItem;
  variant: "full" | "card" | "strip";
}

function getDaysBadgeText(daysToExpiry: number): string {
  if (daysToExpiry < 0) return "Overdue";
  if (daysToExpiry === 0) return "Today";
  return `${daysToExpiry} days`;
}

function getHealthColorClass(daysToExpiry: number): string {
  if (daysToExpiry <= 14) return "text-destructive";
  if (daysToExpiry <= 30) return "text-warning";
  return "text-primary";
}

function getBorderColorClass(daysToExpiry: number): string {
  if (daysToExpiry <= 14) return "border-destructive";
  if (daysToExpiry <= 30) return "border-warning";
  return "border-primary";
}

function formatExpiryDate(expiryDate: string): string {
  const [y, m, d] = expiryDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function ObligationRow({ obligation, variant }: ObligationRowProps) {
  const { daysToExpiry, documentType, vehicleName, expiryDate } = obligation;
  const badgeText = getDaysBadgeText(daysToExpiry);
  const colorClass = getHealthColorClass(daysToExpiry);
  const borderClass = getBorderColorClass(daysToExpiry);

  if (variant === "full") {
    return (
      <li className="flex items-center justify-between py-3 gap-4">
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm truncate">{documentType}</span>
          <span className="text-xs text-muted-foreground truncate">{vehicleName}</span>
          <span className="text-xs text-muted-foreground">{formatExpiryDate(expiryDate)}</span>
        </div>
        <span className={cn("text-sm font-semibold shrink-0", colorClass)}>
          {badgeText}
        </span>
      </li>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("pl-3 border-l-2 py-1", borderClass)}>
        <span className="text-xs font-medium block">{documentType}</span>
        <span className={cn("text-xs", colorClass)}>{badgeText}</span>
      </div>
    );
  }

  // strip
  return (
    <li className="flex items-center justify-between py-2 gap-3">
      <span className="text-sm truncate min-w-0">
        <span className="font-medium">{vehicleName}</span>
        <span className="text-muted-foreground"> · {documentType}</span>
      </span>
      <span className={cn("text-sm font-semibold shrink-0", colorClass)}>
        {badgeText}
      </span>
    </li>
  );
}
