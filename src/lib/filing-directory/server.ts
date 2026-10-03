import path from "node:path";
import { FilingDirectory } from "@/lib/filing-directory/filing-directory";
import type { SuggestInput, Suggestion } from "@/lib/filing-directory/types";
import { MANUAL_LEAVES } from "@/lib/filing-directory/manual-tree";

export function getDirectoryPath(): string {
  return path.join(process.cwd(), "Directory.md");
}

export function createFilingDirectory(): FilingDirectory {
  return new FilingDirectory(getDirectoryPath(), {
    aiSuggest: process.env.FILING_MAP_AI_API_KEY ? aiSuggest : undefined,
  });
}

async function aiSuggest(input: SuggestInput): Promise<Suggestion[]> {
  const key = process.env.FILING_MAP_AI_API_KEY;
  if (!key) return [];

  const leafPaths = MANUAL_LEAVES.map((l) => l.path).join("\n");
  const prompt = `You help file personal files into a Personal Filing Directory.
Pick 2-3 Manual leaf paths from this exact list (never invent letters):
${leafPaths}

Filename: ${input.name}
Description: ${input.description ?? "(none)"}

Reply with JSON only: {"homes":["path1","path2"]}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.FILING_MAP_AI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: "Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as { homes?: string[] };
    const allowed = new Set(MANUAL_LEAVES.map((l) => l.path));
    return (parsed.homes ?? [])
      .filter((h) => allowed.has(h))
      .slice(0, 3)
      .map((home) => ({
        home,
        source: "ai" as const,
        strength: "candidate" as const,
      }));
  } catch {
    return [];
  }
}
