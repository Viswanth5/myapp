import { ParsedEntry, ParseResult } from "./types";
import { parseDeterministic } from "./deterministic";
import { parseWithGemini } from "./gemini";

export * from "./types";
export * from "./deterministic";
export * from "./gemini";

export async function parseInput(input: string): Promise<ParseResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      entries: [],
      source: "rule-based",
      originalText: input,
    };
  }

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  if (hasApiKey) {
    try {
      const entries = await parseWithGemini(trimmed);
      return {
        entries,
        source: "gemini",
        originalText: input,
      };
    } catch {
      const fallbackEntries = parseDeterministic(trimmed);
      return {
        entries: fallbackEntries,
        source: "rule-based",
        originalText: input,
      };
    }
  }

  const entries = parseDeterministic(trimmed);
  return {
    entries,
    source: "rule-based",
    originalText: input,
  };
}
