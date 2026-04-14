"use client";

import { CheckCircle } from "lucide-react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { Button } from "@/components/ui/button";
import { ObligationRow } from "./ObligationRow";
import type { ObligationItem } from "@/lib/obligations";

const FILTER_OPTIONS = ["all", "insurance", "registration", "permits"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const FILTER_LABELS: Record<FilterOption, string> = {
  all:          "All",
  insurance:    "Insurance",
  registration: "Registration",
  permits:      "Permits",
};

// Document types that fall under each filter chip
const FILTER_DOCUMENT_TYPES: Partial<Record<FilterOption, string[]>> = {
  insurance:    ["Insurance"],
  registration: ["Registration"],
  permits:      ["License", "Seasonal Permit"],
};

interface ObligationTimelineProps {
  obligations: ObligationItem[];
}

function groupByMonth(obligations: ObligationItem[]): Map<string, ObligationItem[]> {
  const groups = new Map<string, ObligationItem[]>();
  for (const o of obligations) {
    const [y, m, d] = o.expiryDate.split("-").map(Number);
    const label = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(y, m - 1, d));
    const existing = groups.get(label) ?? [];
    existing.push(o);
    groups.set(label, existing);
  }
  return groups;
}

export function ObligationTimeline({ obligations }: ObligationTimelineProps) {
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringLiteral(FILTER_OPTIONS).withDefault("all"),
  );

  const filteredObligations =
    filter === "all"
      ? obligations
      : obligations.filter(o => {
          const allowedTypes = FILTER_DOCUMENT_TYPES[filter] ?? [];
          return allowedTypes.some(t => t.toLowerCase() === o.documentType.toLowerCase());
        });

  const monthGroups = groupByMonth(filteredObligations);

  return (
    <div className="flex flex-col gap-6">
      {/* Filter chip bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map(option => (
          <Button
            key={option}
            variant={filter === option ? "default" : "outline"}
            size="sm"
            aria-pressed={filter === option}
            onClick={() => setFilter(option === "all" ? null : option)}
            className="shrink-0 min-h-[44px]"
          >
            {FILTER_LABELS[option]}
          </Button>
        ))}
      </div>

      {/* Empty state */}
      {filteredObligations.length === 0 && filter === "all" && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <CheckCircle size={48} className="text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-lg">All obligations are current.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nothing due in the next 90 days.
            </p>
          </div>
        </div>
      )}
      {filteredObligations.length === 0 && filter !== "all" && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No {FILTER_LABELS[filter].toLowerCase()} obligations found.
        </p>
      )}

      {/* Month-grouped obligation rows */}
      {Array.from(monthGroups.entries()).map(([monthLabel, monthObligations]) => (
        <section key={monthLabel} aria-label={monthLabel}>
          <h2 className="font-semibold text-base mb-3 text-muted-foreground uppercase tracking-wide text-xs">
            {monthLabel}
          </h2>
          <ul role="list" className="divide-y divide-border border rounded-lg px-4">
            {monthObligations.map(o => (
              <ObligationRow key={o.reminderId} obligation={o} variant="full" />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
