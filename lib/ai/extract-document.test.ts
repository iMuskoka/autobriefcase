import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractDocument } from "./extract-document";

const mockGenerateObject = vi.fn();

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-anthropic-model"),
}));

let mockFetch: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockGenerateObject.mockClear();
  // Re-establish the spy each test so mockRestore() in afterEach doesn't break subsequent tests
  mockFetch = vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  } as Response);
});

afterEach(() => {
  mockFetch.mockRestore();
});

describe("extractDocument", () => {
  it("returns ExtractionResult with correct fields when generateObject succeeds", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        fields: [
          { key: "holderName", value: "Jane Smith", confidence: "confirmed" },
          { key: "expiryDate", value: "2026-07-01", confidence: "confirmed" },
        ],
        overallConfidence: "confirmed",
        rawText: "Ontario auto insurance card, expires 2026-07-01",
      },
    });

    const result = await extractDocument("https://example.com/img.jpg", "img.jpg");

    expect(result.overallConfidence).toBe("confirmed");
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].key).toBe("holderName");
    expect(result.fields[0].value).toBe("Jane Smith");
    expect(result.rawText).toBe("Ontario auto insurance card, expires 2026-07-01");
  });

  it("assigns verify confidence for ambiguous fields and exercises PDF fetch path", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        fields: [
          { key: "holderName", value: "J. Smith", confidence: "verify" },
          { key: "expiryDate", value: "2026-07-01", confidence: "confirmed" },
        ],
        overallConfidence: "verify",
      },
    });

    const pdfUrl = "https://example.com/doc.pdf";
    const result = await extractDocument(pdfUrl, "doc.pdf");

    expect(mockFetch).toHaveBeenCalledWith(pdfUrl);
    expect(result.overallConfidence).toBe("verify");
    expect(result.fields[0].confidence).toBe("verify");
    expect(result.fields[1].confidence).toBe("confirmed");
  });

  it("returns failed ExtractionResult when generateObject throws", async () => {
    mockGenerateObject.mockRejectedValue(new Error("API timeout"));

    const result = await extractDocument("https://example.com/img.png", "img.png");

    expect(result.overallConfidence).toBe("failed");
    expect(result.fields).toHaveLength(0);
  });
});
