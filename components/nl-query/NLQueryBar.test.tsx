import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { NLQueryBar } from "./NLQueryBar";

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

function makeStreamResponse(chunks: string[]): Response {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

function makeJsonErrorResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Text appears in both the sr-only live region and the visual panel.
// Use this helper to verify presence without failing on "multiple elements found".
function expectTextPresent(text: string | RegExp) {
  const matches = screen.getAllByText(text);
  expect(matches.length).toBeGreaterThan(0);
}

beforeEach(() => {
  vi.restoreAllMocks();
  // Fix 11: unstub globals so vi.stubGlobal("fetch", …) stubs don't leak between tests
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NLQueryBar", () => {
  describe("idle → focused transition (AC 1)", () => {
    it("transitions to focused state when input is clicked", async () => {
      const user = userEvent.setup();
      render(<NLQueryBar />);

      const input = screen.getByLabelText("Fleet query");
      await user.click(input);

      // In focused state the send button becomes visible
      expect(screen.getByRole("button", { name: "Submit query" })).toBeInTheDocument();
    });

    it("shows placeholder 'Ask about your fleet…' in idle state", () => {
      render(<NLQueryBar />);
      expect(screen.getByPlaceholderText("Ask about your fleet…")).toBeInTheDocument();
    });
  });

  describe("focused → loading on Enter key (AC 2)", () => {
    it("transitions to loading when Enter is pressed with a query", async () => {
      const user = userEvent.setup();
      // fetch resolves slowly — we just need it to be called
      vi.stubGlobal(
        "fetch",
        vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
      );

      render(<NLQueryBar />);
      const input = screen.getByLabelText("Fleet query");
      await user.click(input);
      await user.type(input, "when does my insurance expire?");
      await user.keyboard("{Enter}");

      // Loading state: send button disabled
      const sendBtn = screen.getByRole("button", { name: "Submit query" });
      expect(sendBtn).toBeDisabled();
    });
  });

  describe("streaming chunks accumulate (AC 3)", () => {
    it("renders streamed text incrementally in the result panel", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeStreamResponse(["Insurance expires ", "April 1, 2027."]),
        ),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      const input = screen.getByLabelText("Fleet query");
      await user.click(input);
      await user.type(input, "insurance expiry?");
      await user.keyboard("{Enter}");

      // Text appears in both sr-only live region and visual panel — both are correct
      await waitFor(() => expectTextPresent(/Insurance expires/));
      expectTextPresent(/April 1, 2027/);
    });
  });

  describe("error state — 429 (AC 5)", () => {
    it("shows 'Query limit reached' message on 429 response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeJsonErrorResponse(429, {
            error: "Rate limit exceeded. Try again in 5 minutes.",
          }),
        ),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      await user.click(screen.getByLabelText("Fleet query"));
      await user.type(screen.getByLabelText("Fleet query"), "any question");
      await user.keyboard("{Enter}");

      await waitFor(() => expectTextPresent(/Rate limit exceeded/));
    });
  });

  describe("error state — non-429 (AC 5)", () => {
    it("shows generic error message on non-429 error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeJsonErrorResponse(500, { error: "Internal server error" }),
        ),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      await user.click(screen.getByLabelText("Fleet query"));
      await user.type(screen.getByLabelText("Fleet query"), "any question");
      await user.keyboard("{Enter}");

      await waitFor(() => expectTextPresent("Something went wrong — try again."));
    });
  });

  describe("Escape key resets to idle (AC 7)", () => {
    it("resets to idle from focused state on Escape", async () => {
      const user = userEvent.setup();
      render(<NLQueryBar />);

      const input = screen.getByLabelText("Fleet query");
      await user.click(input);
      // Now focused — send button visible
      expect(screen.getByRole("button", { name: "Submit query" })).toBeInTheDocument();

      await user.keyboard("{Escape}");
      // Back to idle — send button gone
      expect(
        screen.queryByRole("button", { name: "Submit query" }),
      ).not.toBeInTheDocument();
    });

    it("resets to idle from result state on Escape", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeStreamResponse(["Fleet answer text"])),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      await user.click(screen.getByLabelText("Fleet query"));
      await user.type(screen.getByLabelText("Fleet query"), "any question");
      await user.keyboard("{Enter}");

      await waitFor(() => expectTextPresent("Fleet answer text"));

      // Global Escape listener fires regardless of which element has focus
      await user.keyboard("{Escape}");
      expect(screen.queryByText("Fleet answer text")).not.toBeInTheDocument();
    });
  });

  describe("Clear button resets to idle (AC 7)", () => {
    it("resets to idle from result state when Clear is clicked", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeStreamResponse(["My fleet answer"])),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      await user.click(screen.getByLabelText("Fleet query"));
      await user.type(screen.getByLabelText("Fleet query"), "fleet status?");
      await user.keyboard("{Enter}");

      await waitFor(() => expectTextPresent("My fleet answer"));

      // Two Clear buttons exist in result state: X icon in bar + "Clear" in panel; click the first
      const [clearBtn] = screen.getAllByRole("button", { name: "Clear" });
      await user.click(clearBtn);

      expect(screen.queryByText("My fleet answer")).not.toBeInTheDocument();
    });

    it("resets to idle from error state when Clear is clicked", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeJsonErrorResponse(500, { error: "err" })),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      await user.click(screen.getByLabelText("Fleet query"));
      await user.type(screen.getByLabelText("Fleet query"), "fleet status?");
      await user.keyboard("{Enter}");

      await waitFor(() => expectTextPresent("Something went wrong — try again."));

      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(
        screen.queryByText("Something went wrong — try again."),
      ).not.toBeInTheDocument();
    });

    it("resets to idle from empty state when Clear is clicked", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeStreamResponse(["I don't have any matching vehicles."]),
        ),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      await user.click(screen.getByLabelText("Fleet query"));
      await user.type(screen.getByLabelText("Fleet query"), "unknown vehicle?");
      await user.keyboard("{Enter}");

      await waitFor(() =>
        expectTextPresent("No matching information found in your fleet."),
      );

      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(
        screen.queryByText("No matching information found in your fleet."),
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility (AC 9)", () => {
    it("has role='search' on the container", () => {
      render(<NLQueryBar />);
      expect(screen.getByRole("search")).toBeInTheDocument();
    });

    it("persistent aria-live='polite' region announces result text", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeStreamResponse(["Some answer"])),
      );

      const user = userEvent.setup();
      render(<NLQueryBar />);

      await user.click(screen.getByLabelText("Fleet query"));
      await user.type(screen.getByLabelText("Fleet query"), "any question");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        // The sr-only live region is always in the DOM; verify it contains the result
        const liveRegion = document.querySelector("[aria-live='polite']");
        expect(liveRegion?.textContent).toContain("Some answer");
      });
    });
  });
});
