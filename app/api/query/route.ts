import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createClient } from "@/lib/supabase/server";
import { buildFleetContext, queryFleet } from "@/lib/ai/query-fleet";

const MAX_QUERY_LENGTH = 1000;

function makeRatelimiter(): Ratelimit | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(20, "60 m"),
  });
}

export async function POST(request: Request) {
  // 1. Auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate request body
  let query: string;
  try {
    const body = await request.json();
    if (!body.query || typeof body.query !== "string" || body.query.trim() === "") {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }
    // P2 patch: cap query length to prevent context-window exhaustion
    if (body.query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json({ error: "Query is too long." }, { status: 400 });
    }
    query = body.query.trim();
  } catch {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  // 3. Rate limiting (gracefully skipped when Upstash env vars absent)
  const ratelimit = makeRatelimiter();
  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(`ratelimit:query:${user.id}`);
    if (!success) {
      // P1 patch: floor at 1 to avoid "0 minutes" or negative values on clock skew
      const minutesRemaining = Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${minutesRemaining} minutes.` },
        { status: 429 },
      );
    }
  }

  // 4. Build fleet context + stream response
  try {
    const context = await buildFleetContext(supabase);
    const result  = await queryFleet({ context, query });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[api/query] Claude API error:", err);
    return NextResponse.json(
      { error: "I couldn't find that — try browsing your fleet." },
      { status: 500 },
    );
  }
}
