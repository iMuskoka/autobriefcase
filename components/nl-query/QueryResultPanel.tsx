"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { QueryState } from "./NLQueryBar";

interface QueryResultPanelProps {
  text: string;
  state: QueryState;
  onClear: () => void;
}

export function QueryResultPanel({ text, state, onClear }: QueryResultPanelProps) {
  return (
    // Fix 9: aria-live removed — NLQueryBar keeps a persistent sr-only live region
    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-4 min-h-[80px]">
      {state === "loading" && (
        // Fix 6: show accumulated text as it streams; fall back to skeleton until first bytes arrive
        text ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )
      )}

      {state === "result" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {state === "error" && (
        <p className="text-sm text-destructive">{text}</p>
      )}

      {state === "empty" && (
        <p className="text-sm text-muted-foreground">
          No matching information found in your fleet.
        </p>
      )}
    </div>
  );
}
