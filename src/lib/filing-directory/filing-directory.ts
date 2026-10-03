import fs from "node:fs/promises";
import {
  createEmptyDirectoryMarkdown,
  parseDirectoryMarkdown,
  serializeDirectoryMarkdown,
} from "./directory-md";
import { listManualLeaves } from "./manual-tree";
import { suggestFromRules } from "./rules";
import type {
  ConfirmAddInput,
  ConfirmAddResult,
  DirectoryEntry,
  ManualLeaf,
  SuggestInput,
  SuggestResult,
  Suggestion,
} from "./types";

export type FilingDirectoryOptions = {
  /** Optional AI suggester; only called when rules mark the case unclear. */
  aiSuggest?: (input: SuggestInput) => Promise<Suggestion[]>;
};

export class FilingDirectory {
  constructor(
    private readonly directoryPath: string,
    private readonly options: FilingDirectoryOptions = {},
  ) {}

  async listEntries(): Promise<DirectoryEntry[]> {
    const text = await this.readOrInit();
    return parseDirectoryMarkdown(text);
  }

  async confirmAdd(input: ConfirmAddInput): Promise<ConfirmAddResult> {
    const file = input.file.trim();
    const home = input.home.trim();
    const note = (input.note ?? "").trim();
    if (!file) throw new Error("File is required");
    if (!home) throw new Error("Home is required");

    const entries = await this.listEntries();
    const duplicateWarning = entries.some(
      (e) => e.file.toLowerCase() === file.toLowerCase(),
    );
    const entry: DirectoryEntry = {
      id: `row-${entries.length}`,
      file,
      home,
      note,
    };
    const next = [...entries, entry];
    await this.write(next);
    return { entry, duplicateWarning };
  }

  async search(query: string): Promise<DirectoryEntry[]> {
    const q = query.trim().toLowerCase();
    const entries = await this.listEntries();
    if (!q) return entries;
    return entries.filter((e) => e.file.toLowerCase().includes(q));
  }

  async update(
    id: string,
    fields: Partial<Pick<DirectoryEntry, "file" | "home" | "note">>,
  ): Promise<DirectoryEntry> {
    const entries = await this.listEntries();
    const index = entries.findIndex((e) => e.id === id);
    if (index < 0) throw new Error(`Entry not found: ${id}`);
    const current = entries[index];
    const updated: DirectoryEntry = {
      ...current,
      file: fields.file !== undefined ? fields.file.trim() : current.file,
      home: fields.home !== undefined ? fields.home.trim() : current.home,
      note: fields.note !== undefined ? fields.note.trim() : current.note,
    };
    if (!updated.file) throw new Error("File is required");
    if (!updated.home) throw new Error("Home is required");
    const next = [...entries];
    next[index] = updated;
    await this.write(next);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const entries = await this.listEntries();
    const next = entries.filter((e) => e.id !== id);
    if (next.length === entries.length) {
      throw new Error(`Entry not found: ${id}`);
    }
    await this.write(next);
  }

  async suggest(input: SuggestInput): Promise<SuggestResult> {
    const ruleResult = suggestFromRules(input);
    if (!ruleResult.unclear) {
      return ruleResult;
    }

    let ai: Suggestion[] = [];
    if (this.options.aiSuggest) {
      try {
        ai = await this.options.aiSuggest(input);
      } catch {
        ai = [];
      }
    }

    return {
      suggestions: [...ruleResult.suggestions, ...ai],
      unclear: true,
    };
  }

  listManualLeaves(): ManualLeaf[] {
    return listManualLeaves();
  }

  private async readOrInit(): Promise<string> {
    try {
      return await fs.readFile(this.directoryPath, "utf8");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        const empty = createEmptyDirectoryMarkdown();
        await fs.writeFile(this.directoryPath, empty, "utf8");
        return empty;
      }
      throw err;
    }
  }

  private async write(entries: DirectoryEntry[]): Promise<void> {
    // Re-id rows so ids stay stable as row-N after rewrite
    const normalized = entries.map((e, i) => ({ ...e, id: `row-${i}` }));
    await fs.writeFile(
      this.directoryPath,
      serializeDirectoryMarkdown(normalized),
      "utf8",
    );
  }
}

export { listManualLeaves } from "./manual-tree";
export type * from "./types";
