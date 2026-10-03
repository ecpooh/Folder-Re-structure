import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FilingDirectory } from "./filing-directory";

async function tempFiling() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "filing-map-"));
  const directoryPath = path.join(dir, "Directory.md");
  await fs.writeFile(
    directoryPath,
    `# Directory

| File | Home | Note |
| --- | --- | --- |
`,
    "utf8",
  );
  return { dir, directoryPath, filing: new FilingDirectory(directoryPath) };
}

describe("FilingDirectory.confirmAdd", () => {
  let dir: string;
  let directoryPath: string;
  let filing: FilingDirectory;

  beforeEach(async () => {
    ({ dir, directoryPath, filing } = await tempFiling());
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("appends a Markdown table row with File, Home, and Note", async () => {
    const result = await filing.confirmAdd({
      file: "invoice-march.pdf",
      home: "F - Finance / F1 E-Bills",
      note: "Q1",
    });

    expect(result.duplicateWarning).toBe(false);
    const text = await fs.readFile(directoryPath, "utf8");
    expect(text).toContain("| invoice-march.pdf | F - Finance / F1 E-Bills | Q1 |");
  });

  it("stores a free-typed Home exactly as given", async () => {
    await filing.confirmAdd({
      file: "odd.txt",
      home: "Somewhere / Custom",
    });
    const text = await fs.readFile(directoryPath, "utf8");
    expect(text).toContain("| odd.txt | Somewhere / Custom |  |");
  });

  it("returns a soft duplicate warning but still inserts another row", async () => {
    await filing.confirmAdd({
      file: "trip.docx",
      home: "A - Productivity / A5 Travel",
    });
    const result = await filing.confirmAdd({
      file: "trip.docx",
      home: "S - Special Event",
      note: "second intent",
    });

    expect(result.duplicateWarning).toBe(true);
    const entries = await filing.listEntries();
    expect(entries.filter((e) => e.file === "trip.docx")).toHaveLength(2);
  });
});

describe("FilingDirectory.search / update / remove", () => {
  let dir: string;
  let filing: FilingDirectory;

  beforeEach(async () => {
    ({ dir, filing } = await tempFiling());
    await filing.confirmAdd({
      file: "invoice-march.pdf",
      home: "F - Finance / F1 E-Bills",
    });
    await filing.confirmAdd({
      file: "trip-itinerary.docx",
      home: "A - Productivity / A5 Travel",
      note: "Japan",
    });
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("searches File substrings case-insensitively", async () => {
    const hits = await filing.search("TRIP");
    expect(hits).toHaveLength(1);
    expect(hits[0].file).toBe("trip-itinerary.docx");
  });

  it("updates File, Home, and Note and rewrites the table", async () => {
    const [entry] = await filing.search("invoice");
    const updated = await filing.update(entry.id, {
      home: "H - Household Affair / H2 Household Finance",
      note: "shared",
    });
    expect(updated.home).toContain("H2");
    const again = await filing.listEntries();
    expect(again.find((e) => e.id === updated.id)?.note).toBe("shared");
  });

  it("removes a row and leaves others intact", async () => {
    const [entry] = await filing.search("invoice");
    await filing.remove(entry.id);
    const remaining = await filing.listEntries();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].file).toBe("trip-itinerary.docx");
  });
});

describe("FilingDirectory.suggest and listManualLeaves", () => {
  let dir: string;
  let filing: FilingDirectory;

  beforeEach(async () => {
    ({ dir, filing } = await tempFiling());
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns strong Manual leaves for clear boundary cases", async () => {
    const cases: Array<{ name: string; description?: string; homeIncludes: string }> = [
      { name: "wedding-album.txt", description: "forever milestone", homeIncludes: "S - Special Event" },
      { name: "party-invite.txt", description: "one-off event", homeIncludes: "X - One-off Event" },
      { name: "scratch.tmp", description: "temporary days only", homeIncludes: "T - Temporary" },
      { name: "project-budget.xlsx", description: "active work project budget", homeIncludes: "A2 Work" },
      { name: "company-handbook.pdf", description: "company doc employer", homeIncludes: "G4 Company" },
      { name: "electric-ebill.pdf", description: "e-bill", homeIncludes: "F1 E-Bills" },
      { name: "joint-rent.pdf", description: "household shared finance", homeIncludes: "H2 Household Finance" },
      { name: "toastmasters.pdf", description: "soft skill personal development", homeIncludes: "A1 Personal" },
      { name: "rust-notes.md", description: "technical study course notes", homeIncludes: "A3 Study Material" },
      { name: "cpr-prep.pdf", description: "cpr exam", homeIncludes: "A41 CPR" },
      { name: "trip-itinerary.docx", description: "travel flight hotel", homeIncludes: "A5 Travel" },
      { name: "setup.exe", description: "software installer", homeIncludes: "D - Program" },
      { name: "world.mcworld", description: "minecraft save", homeIncludes: "E1 Minecraft" },
      { name: "vacation.jpg", description: "personal photo", homeIncludes: "B - Image" },
      { name: "passport-scan.pdf", description: "person info passport", homeIncludes: "G - Peoples" },
      { name: "episode.mkv", description: "anime animation watched", homeIncludes: "C21 Animate" },
      { name: "short.blend", description: "my animation blender project", homeIncludes: "K - Kreative" },
      { name: "Thumbs.db", description: "thumbnail cache", homeIncludes: "R - Raw" },
    ];

    for (const c of cases) {
      const result = await filing.suggest({ name: c.name, description: c.description });
      expect(result.unclear, c.name).toBe(false);
      expect(
        result.suggestions.some((s) => s.home.includes(c.homeIncludes)),
        `${c.name} → ${c.homeIncludes}`,
      ).toBe(true);
    }
  });

  it("degrades gracefully without AI when unclear", async () => {
    const result = await filing.suggest({ name: "mystery.bin", description: "unclear blob" });
    expect(result.unclear).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it("includes AI options when unclear and aiSuggest is configured", async () => {
    const t = await tempFiling();
    const filingAi = new FilingDirectory(t.directoryPath, {
      aiSuggest: async () => [
        {
          home: "U - Unsorted",
          source: "ai",
          strength: "candidate",
        },
      ],
    });
    const result = await filingAi.suggest({ name: "mystery.bin" });
    expect(result.unclear).toBe(true);
    expect(result.suggestions.some((s) => s.source === "ai")).toBe(true);
    await fs.rm(t.dir, { recursive: true, force: true });
  });

  it("lists Manual leaves including R - Raw and excluding invented letters", () => {
    const leaves = filing.listManualLeaves();
    expect(leaves.some((l) => l.code === "R" && l.path === "R - Raw")).toBe(true);
    for (const banned of ["J", "M", "N", "O", "Q", "W", "Y"]) {
      expect(leaves.some((l) => l.code === banned)).toBe(false);
    }
  });
});
