import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { DOCUMENT_EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import type { ExtractionResult } from "@/types";

const extractionSchema = z.object({
  fields: z.array(
    z.object({
      key: z.string(),
      value: z.string().nullable(),
      confidence: z.enum(["confirmed", "verify", "failed"]),
    }),
  ),
  overallConfidence: z.enum(["confirmed", "verify", "failed"]),
  rawText: z.string().optional(),
});

export async function extractDocument(
  signedUrl: string,
  fileName: string,
): Promise<ExtractionResult> {
  try {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const isPdf = ext === "pdf";
    const isPng = ext === "png";
    const mimeType = isPdf
      ? "application/pdf"
      : isPng
        ? "image/png"
        : "image/jpeg";

    type FileContent =
      | { type: "image"; image: URL }
      | { type: "file"; data: string; mediaType: string };

    let fileContent: FileContent;
    if (isPdf) {
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      fileContent = { type: "file", data: base64, mediaType: mimeType };
    } else {
      fileContent = { type: "image", image: new URL(signedUrl) };
    }

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: extractionSchema,
      system: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            fileContent,
            { type: "text", text: "Extract all key fields from this vehicle document." },
          ],
        },
      ],
    });

    return object as ExtractionResult;
  } catch (error) {
    console.error("extractDocument error:", error);
    return { fields: [], overallConfidence: "failed" };
  }
}
