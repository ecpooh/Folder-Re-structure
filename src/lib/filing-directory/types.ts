export type DirectoryEntry = {
  id: string;
  file: string;
  home: string;
  note: string;
};

export type ConfirmAddInput = {
  file: string;
  home: string;
  note?: string;
};

export type ConfirmAddResult = {
  entry: DirectoryEntry;
  duplicateWarning: boolean;
};

export type SuggestInput = {
  name: string;
  description?: string;
};

export type Suggestion = {
  home: string;
  source: "rule" | "ai";
  strength: "strong" | "candidate";
  reason?: string;
};

export type SuggestResult = {
  suggestions: Suggestion[];
  unclear: boolean;
};

export type ManualLeaf = {
  code: string;
  name: string;
  path: string;
  parent?: string;
};
