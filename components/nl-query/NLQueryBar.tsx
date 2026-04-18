"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QueryResultPanel } from "./QueryResultPanel";

export type QueryState = "idle" | "focused" | "loading" | "result" | "error" | "empty";

const EMPTY_PHRASES = ["no vehicles", "not in the context", "i don't have", "no information"];

interface NLQueryBarProps {
  autoFocus?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function NLQueryBar({ autoFocus, fullWidth, className }: NLQueryBarProps) {
  const [state, setState] = useState<QueryState>("idle");
  const [query, setQuery] = useState("");
  const [displayText, setDisplayText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Fix 1+3: AbortController cancels in-flight stream on reset or new submit
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetToIdle = useCallback(() => {
    // Fix 1: abort any in-flight stream before resetting
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState("idle");
    setQuery("");
    setDisplayText("");
  }, []);

  const submitQuery = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    // Fix 3: abort any previous in-flight request before starting a new one
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState("loading");
    setDisplayText("");

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        if (res.status === 429) {
          // Fix 8: use verbatim API message; fallback only if body lacks error field
          setDisplayText(data.error ?? "Rate limit reached. Please try again later.");
        } else {
          setDisplayText("Something went wrong — try again.");
        }
        setState("error");
        return;
      }

      // Fix 5: guard against null body (Safari iOS 16, some edge runtimes)
      if (!res.body) {
        setDisplayText("Something went wrong — try again.");
        setState("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setDisplayText(accumulated);
      }
      // Fix 4: flush final UTF-8 bytes buffered inside the decoder
      accumulated += decoder.decode();
      if (accumulated !== displayText) {
        setDisplayText(accumulated);
      }

      const lower = accumulated.toLowerCase();
      const isEmpty = EMPTY_PHRASES.some((p) => lower.includes(p));
      setState(isEmpty ? "empty" : "result");
    } catch (err) {
      // Fix 1: don't show error when the request was intentionally aborted
      if (err instanceof Error && err.name === "AbortError") return;
      setDisplayText("Something went wrong — try again.");
      setState("error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      submitQuery(query);
    } else if (e.key === "Escape") {
      resetToIdle();
    }
  };

  // Fix 7: global Escape listener — fires regardless of which element has focus,
  // so Escape works even after input loses focus when disabled during loading
  useEffect(() => {
    if (state === "idle") return;
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetToIdle();
      }
    };
    document.addEventListener("keydown", handleGlobalEscape);
    return () => document.removeEventListener("keydown", handleGlobalEscape);
  }, [state, resetToIdle]);

  const handleFocus = () => {
    if (state === "idle") {
      setState("focused");
    }
  };

  // Fix 2: don't reset to idle if the user has typed text (Send button click relies on this)
  const handleBlur = () => {
    if (state === "focused" && !displayText && !query.trim()) {
      setState("idle");
    }
  };

  const showPanel =
    state === "loading" || state === "result" || state === "error" || state === "empty";
  const showSendButton = state === "focused" || state === "loading";
  const showClearButton = state === "result" || state === "error" || state === "empty";
  const isLoading = state === "loading";

  // Fix 9: compute live-region announcement text for the always-present sr-only region
  const liveAnnouncement =
    state === "result" || state === "error" ? displayText
    : state === "empty" ? "No matching information found in your fleet."
    : state === "loading" ? "Loading…"
    : "";

  return (
    <div
      role="search"
      className={cn("relative", fullWidth ? "w-full" : "max-w-sm w-full", className)}
    >
      {/* Fix 9: always-present live region so AT announces reliably on content change */}
      <div aria-live="polite" className="sr-only">{liveAnnouncement}</div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 transition-colors",
          (state === "focused" || state === "loading") && "ring-1 ring-ring",
          isLoading && "opacity-70",
        )}
      >
        <Search size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your fleet…"
          maxLength={1000}
          disabled={isLoading}
          aria-label="Fleet query"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed min-h-[28px]"
        />
        {showSendButton && (
          <button
            type="button"
            onClick={() => submitQuery(query)}
            disabled={isLoading || !query.trim()}
            aria-label="Submit query"
            className="shrink-0 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        {showClearButton && (
          <button
            type="button"
            onClick={resetToIdle}
            aria-label="Clear"
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {showPanel && (
        <QueryResultPanel text={displayText} state={state} onClear={resetToIdle} />
      )}
    </div>
  );
}
