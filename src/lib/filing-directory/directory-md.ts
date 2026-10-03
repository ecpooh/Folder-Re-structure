import type { DirectoryEntry } from "./types";

const TABLE_HEADER = `| File | Home | Note |
| --- | --- | --- |`;

export function createEmptyDirectoryMarkdown(): string {
  return `# Directory

${TABLE_HEADER}
`;
}

export function parseDirectoryMarkdown(text: string): DirectoryEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: DirectoryEntry[] = [];
  let inTable = false;
  let rowIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\|\s*File\s*\|\s*Home\s*\|\s*Note\s*\|$/i.test(trimmed)) {
      inTable = true;
      continue;
    }
    if (inTable && /^\|\s*-+/.test(trimmed)) {
      continue;
    }
    if (inTable && trimmed.startsWith("|")) {
      const cells = splitRow(trimmed);
      if (cells.length >= 3) {
        const [file, home, note] = cells;
        if (file.toLowerCase() === "file") continue;
        entries.push({
          id: `row-${rowIndex}`,
          file,
          home,
          note,
        });
        rowIndex += 1;
      }
      continue;
    }
    if (inTable && trimmed === "") {
      // keep scanning; blank lines may appear after table
      continue;
    }
  }

  return entries;
}

export function serializeDirectoryMarkdown(entries: DirectoryEntry[]): string {
  const rows = entries.map(
    (e) => `| ${escapeCell(e.file)} | ${escapeCell(e.home)} | ${escapeCell(e.note)} |`,
  );
  return `# Directory

${TABLE_HEADER}
${rows.length ? `${rows.join("\n")}\n` : ""}`;
}

function splitRow(line: string): string[] {
  const inner = line.replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map((c) => unescapeCell(c.trim()));
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function unescapeCell(value: string): string {
  return value.replace(/\\\|/g, "|");
}
