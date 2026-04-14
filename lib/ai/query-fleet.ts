import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NL_QUERY_SYSTEM_PROMPT } from "./prompts";

const TOKEN_BUDGET_CHARS = 8000;

type SupabaseClient = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

type VehicleRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  nickname: string | null;
  documents: {
    document_type: string;
    expiry_date: string | null;
    policy_number: string | null;
    issuer_name: string | null;
    file_name: string;
  }[];
  reminders: {
    expiry_date: string;
    lead_time_days: number;
    status: string;
  }[];
};

export async function buildFleetContext(supabase: SupabaseClient): Promise<string> {
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select(`
      id, make, model, year, nickname,
      documents (document_type, expiry_date, policy_number, issuer_name, file_name),
      reminders (expiry_date, lead_time_days, status)
    `)
    .order("created_at", { ascending: false });

  // DN1 patch: log Supabase errors separately so infrastructure failures are observable
  if (error) {
    console.error("[query-fleet] Failed to fetch fleet context:", error);
    return "The user has no vehicles in their fleet.";
  }

  if (!vehicles || vehicles.length === 0) {
    return "The user has no vehicles in their fleet.";
  }

  // Build each vehicle as a self-contained block
  const vehicleBlocks: string[] = [];

  for (const vehicle of vehicles as VehicleRow[]) {
    const name = vehicle.nickname ?? `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const blockLines: string[] = [`Vehicle: ${name}`];

    const docs = vehicle.documents ?? [];
    if (docs.length > 0) {
      blockLines.push("  Documents:");
      for (const doc of docs) {
        const parts = [`    - ${doc.document_type}`];
        if (doc.expiry_date) parts.push(`expires ${doc.expiry_date}`);
        if (doc.policy_number) parts.push(`policy/number: ${doc.policy_number}`);
        if (doc.issuer_name) parts.push(`issuer: ${doc.issuer_name}`);
        blockLines.push(parts.join(", "));
      }
    } else {
      blockLines.push("  Documents: none");
    }

    const activeReminders = (vehicle.reminders ?? []).filter(
      r => r.status === "pending" || r.status === "sent",
    );
    if (activeReminders.length > 0) {
      blockLines.push("  Active reminders:");
      for (const r of activeReminders) {
        blockLines.push(
          `    - expires ${r.expiry_date}, lead time ${r.lead_time_days} days, status ${r.status}`,
        );
      }
    }

    vehicleBlocks.push(blockLines.join("\n"));
  }

  // P3 patch: drop complete vehicle blocks rather than slicing mid-record
  let context = "USER'S FLEET:";
  let truncated = false;

  for (const block of vehicleBlocks) {
    const candidate = `${context}\n\n${block}`;
    if (candidate.length > TOKEN_BUDGET_CHARS) {
      truncated = true;
      break;
    }
    context = candidate;
  }

  if (truncated) {
    console.warn(
      `[query-fleet] Fleet context truncated to stay within ${TOKEN_BUDGET_CHARS}-char budget.`,
    );
    context += "\n\n[...truncated]";
  }

  return context;
}

export function queryFleet({ context, query }: { context: string; query: string }) {
  return streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: NL_QUERY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Fleet context:\n${context}\n\nQuestion: ${query}`,
      },
    ],
  });
}
