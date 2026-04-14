import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.hoisted ensures mock factories are ready before vi.mock runs
const mockGetUser         = vi.hoisted(() => vi.fn());
const mockBuildFleetCtx  = vi.hoisted(() => vi.fn());
const mockQueryFleet     = vi.hoisted(() => vi.fn());
const mockRatelimitLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/ai/query-fleet", () => ({
  buildFleetContext: mockBuildFleetCtx,
  queryFleet:       mockQueryFleet,
}));

// Mock @upstash/ratelimit — Ratelimit class needs both constructor and static slidingWindow
vi.mock("@upstash/ratelimit", () => {
  const MockRatelimit = vi.fn(function MockRatelimit() {
    return { limit: mockRatelimitLimit };
  }) as unknown as { new (...args: unknown[]): { limit: typeof mockRatelimitLimit }; slidingWindow: () => string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockRatelimit as any).slidingWindow = vi.fn().mockReturnValue("sliding-window-config");
  return { Ratelimit: MockRatelimit };
});

// Mock @upstash/redis — Redis is a class; vi.fn() is callable as a constructor
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

import { POST } from "./route";
import { Ratelimit } from "@upstash/ratelimit";

const USER_ID = "user-uuid-abc";

const makeRequest = (body?: unknown) =>
  new Request("http://localhost/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

function setupAuth(user: { id: string } | null = { id: USER_ID }) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
}

function setupRateLimit(allowed: boolean, resetMs: number = Date.now() + 60_000) {
  mockRatelimitLimit.mockResolvedValue({ success: allowed, reset: resetMs });
}

function setupStream() {
  mockBuildFleetCtx.mockResolvedValue("Fleet context text");
  mockQueryFleet.mockResolvedValue({
    toTextStreamResponse: () => new Response("streamed-answer", { status: 200 }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Provide Upstash env vars by default so rate limiting is active
  process.env.UPSTASH_REDIS_REST_URL   = "https://redis.example.com";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
});

afterEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("POST /api/query", () => {
  describe("AC4 — unauthenticated", () => {
    it("returns 401 when getUser returns no user", async () => {
      setupAuth(null);

      const res = await POST(makeRequest({ query: "when does my insurance expire?" }));

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
      expect(mockBuildFleetCtx).not.toHaveBeenCalled();
      expect(mockQueryFleet).not.toHaveBeenCalled();
    });

    it("returns 401 when getUser returns an auth error", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("session expired") });

      const res = await POST(makeRequest({ query: "any question" }));

      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Unauthorized");
    });
  });

  describe("AC6 — input validation", () => {
    it("returns 400 when query field is missing", async () => {
      setupAuth();

      const res = await POST(makeRequest({ other: "field" }));

      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Query is required.");
      expect(mockQueryFleet).not.toHaveBeenCalled();
    });

    it("returns 400 when query is an empty string", async () => {
      setupAuth();

      const res = await POST(makeRequest({ query: "   " }));

      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Query is required.");
    });

    it("returns 400 when query exceeds 1000 characters", async () => {
      setupAuth();

      const res = await POST(makeRequest({ query: "a".repeat(1001) }));

      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Query is too long.");
      expect(mockQueryFleet).not.toHaveBeenCalled();
    });

    it("returns 400 when body is not valid JSON", async () => {
      setupAuth();

      const res = await POST(
        new Request("http://localhost/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "not-json",
        }),
      );

      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Query is required.");
    });
  });

  describe("AC3 — rate limiting", () => {
    it("returns 429 when rate limit is exceeded", async () => {
      setupAuth();
      // reset = now + 5 minutes → 5 minutes remaining
      const fiveMinutesFromNow = Date.now() + 5 * 60_000;
      setupRateLimit(false, fiveMinutesFromNow);

      const res = await POST(makeRequest({ query: "any question" }));

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error).toMatch(/Rate limit exceeded/);
      expect(body.error).toMatch(/minutes/);
      expect(mockQueryFleet).not.toHaveBeenCalled();
    });

    it("uses correct rate limit key for the authenticated user", async () => {
      setupAuth({ id: USER_ID });
      setupRateLimit(true);
      setupStream();

      await POST(makeRequest({ query: "any question" }));

      expect(mockRatelimitLimit).toHaveBeenCalledWith(`ratelimit:query:${USER_ID}`);
    });
  });

  describe("AC3 — rate limiting skipped when Upstash env vars absent", () => {
    it("skips rate limiting when UPSTASH_REDIS_REST_URL is absent", async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      setupAuth();
      setupStream();

      const res = await POST(makeRequest({ query: "any question" }));

      // Ratelimit constructor should NOT have been called
      expect(Ratelimit).not.toHaveBeenCalled();
      expect(mockRatelimitLimit).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it("skips rate limiting when UPSTASH_REDIS_REST_TOKEN is absent", async () => {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      setupAuth();
      setupStream();

      const res = await POST(makeRequest({ query: "any question" }));

      expect(Ratelimit).not.toHaveBeenCalled();
      expect(mockRatelimitLimit).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
    });
  });

  describe("AC1 — successful streaming response", () => {
    it("returns streaming response from queryFleet on valid request", async () => {
      setupAuth();
      setupRateLimit(true);
      setupStream();

      const res = await POST(makeRequest({ query: "when does my Seadoo insurance expire?" }));

      expect(res.status).toBe(200);
      expect(mockBuildFleetCtx).toHaveBeenCalledOnce();
      expect(mockQueryFleet).toHaveBeenCalledWith({
        context: "Fleet context text",
        query:   "when does my Seadoo insurance expire?",
      });
    });

    it("trims whitespace from query before passing to queryFleet", async () => {
      setupAuth();
      setupRateLimit(true);
      setupStream();

      await POST(makeRequest({ query: "  my question  " }));

      expect(mockQueryFleet).toHaveBeenCalledWith(
        expect.objectContaining({ query: "my question" }),
      );
    });
  });

  describe("AC5 — Claude API error handling", () => {
    it("returns 500 with user-safe message when queryFleet throws", async () => {
      setupAuth();
      setupRateLimit(true);
      mockBuildFleetCtx.mockResolvedValue("context");
      mockQueryFleet.mockRejectedValue(new Error("Anthropic API timeout"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await POST(makeRequest({ query: "any question" }));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("I couldn't find that — try browsing your fleet.");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("returns 500 when buildFleetContext throws", async () => {
      setupAuth();
      setupRateLimit(true);
      mockBuildFleetCtx.mockRejectedValue(new Error("Supabase error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await POST(makeRequest({ query: "any question" }));

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("I couldn't find that — try browsing your fleet.");

      consoleSpy.mockRestore();
    });
  });
});
