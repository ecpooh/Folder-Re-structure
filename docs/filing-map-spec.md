# Spec: Filing Map (v1)

**Status:** ready-for-agent (spec only — no implementation until asked)  
**Product name:** Filing Map  
**Owner decisions:** grilled 2026-10-03; seam jobs rearranged by Edward  
**Related:** [Personal Filing Directory Manual](./Personal_Filing_Directory_Manual.md), [structure summary](./filing-directory-structure.md)

---

## Problem Statement

Edward files personal content into a lettered **Personal Filing Directory** (A–Z homes). When a new or unfiled file shows up, he has to decide the correct leaf home using Manual boundary rules, then later remember where he intended it to live.

Today there is no small local tool that:

1. Helps choose the right A–Z home, and  
2. Remembers that decision in a durable, searchable place.

Large device inventory CSVs exist for disk reality; they are **not** this problem. This app is about **filing intent** — where he decided something should go — stored in one Markdown file he controls.

---

## Solution

A **localhost-only HTTP app** next to a single **`Directory.md`** file.

**Primary loop:** describe or drop one file → app suggests Manual leaf home(s) (rules first; optional AI if an API key is set) → Edward confirms (accept, pick a Manual leaf, or type any path) → app appends a row to `Directory.md`.

**Secondary loop:** search (and optionally browse) `Directory.md` to find a past decision; edit or delete rows in the UI.

**Reference UI:** show the official filing tree so he can see valid homes while confirming.

The app does **not** move files on disk and does **not** verify the file exists at the chosen home in v1.

---

## User Stories

### Suggest & confirm (job 1)

1. As Edward, I can type a filename and optional description, then get suggested A–Z leaf homes.
2. As Edward, I can drop/select a single file; the app uses its name and extension (and my optional description), not file contents.
3. As Edward, when rules clearly match a Manual boundary, I see that leaf as a strong suggestion without needing AI.
4. As Edward, when the case is unclear and an API key is configured, I see 2–3 AI-proposed Manual leaf options.
5. As Edward, when no API key is set, the app still works using rules plus Manual picker / typed path.
6. As Edward, I can accept one suggestion, pick any Manual leaf from the tree/list, or type any free-form path before saving.
7. As Edward, nothing is written to `Directory.md` until I confirm.
8. As Edward, after confirm, a new table row is appended with File, Home, and optional Note.
9. As Edward, if that filename already exists in `Directory.md`, I see a soft warning but can still add another row.
10. As Edward, v1 handles **one file at a time** only (batch is v1.1).

### Search & maintain (job 2)

11. As Edward, I can search `Directory.md` by (part of) a filename and see matching rows with their Home (and Note).
12. As Edward, I can open a separate **Browse** tab to see the full list only when I want it (search UI stays uncluttered).
13. As Edward, I can edit File, Home, and/or Note for an existing row; the app rewrites `Directory.md`.
14. As Edward, I can delete a row; the app rewrites `Directory.md`.
15. As Edward, I can open `Directory.md` by hand and still understand it (Markdown table).

### Filing tree (job 3)

16. As Edward, I can view the official Manual leaf tree (codes + folder names) inside the app for reference and picking.
17. As Edward, typed free-form paths are allowed even if not in the tree; the tree is guidance, not a hard cage on confirm.

### Runtime / trust

18. As Edward, the app binds to `127.0.0.1` only; no auth in v1.
19. As Edward, `Directory.md` lives next to the app and is the only persistence for filing decisions in v1.

---

## Implementation Decisions

| Decision | Choice |
|---|---|
| v1 jobs | (1) Suggest & confirm → append row; (2) Search + edit/delete; (3) Show filing tree |
| Persistence | One `Directory.md` beside the app |
| Entry meaning | **Intent only** (accepted home). Disk confirmation is later |
| Entry shape | Lean: **File \| Home \| Note** (Note optional/empty OK) |
| On-disk format | Markdown **table** |
| Suggestions | **Hybrid:** Manual rules first; optional AI (2–3 options) when unclear and API key present |
| Suggestion depth | Manual **leaf** (e.g. `A - Productivity / A2 Work`), not letter-only |
| Confirm | Accept suggestion **or** pick Manual leaf **or** type any path |
| Input | Drop **or** describe; metadata only (name/ext + description), no file bytes to AI |
| Duplicates | Allowed; soft warning if filename already present |
| Batch | **Out of v1**; **must include in v1.1** |
| Host | Localhost `127.0.0.1`, no auth |
| Stack (default) | Next.js + TypeScript local app unless Edward specifies otherwise |
| Filing rules source | Embed / ship from Personal Filing Directory Manual + structure summary; respect boundary rules; do not invent new letter categories |
| Folder name style | Prefer ASCII hyphen form aligned with preferences (e.g. `A - Productivity`), consistent with skeleton |

### Deep module / test seam: `FilingDirectory`

Single brain behind a thin HTTP UI. Ordered jobs:

1. **Suggest & confirm** — `suggest({ name, description? })` → ranked homes; `confirmAdd({ file, home, note? })` appends a row (with duplicate soft-warning signal).
2. **Search & maintain** — `search(query)`, `listEntries()`, `update(id, fields)`, `remove(id)`; all rewrite/read the Markdown table correctly.
3. **Filing tree** — `listManualLeaves()` / tree structure for picker and reference UI.

HTTP routes and React pages call this module; they are not a second primary test surface for v1.

### Example `Directory.md` shape

```markdown
# Directory

| File | Home | Note |
| --- | --- | --- |
| invoice-march.pdf | F - Finance / F1 E-Bills | |
| trip-itinerary.docx | A - Productivity / A5 Travel | |
```

Exact table parsing/writing rules belong in implementation; rows must round-trip without corrupting hand edits to other parts of the file when practical (at minimum: preserve a clean regenerable table section).

---

## Testing Decisions

**Primary seam:** `FilingDirectory` (above).

**Done looks like:**

- Suggest returns Manual leaves for clear rule cases (boundary examples from the Manual: S/X/T, A2/F/G4, F/H2, A1/A3/A4, A5/S, D/E, G vs B/C, C21 vs K, R meta).
- Without API key, unclear cases still degrade gracefully (rule candidates + empty/partial AI list).
- `confirmAdd` appends a correct table row; duplicate filename returns a warning flag but still inserts when confirmed.
- `search` matches substrings of File (case-insensitive is fine unless later specified).
- `update` / `remove` rewrite `Directory.md` so list/search reflect the change.
- `listManualLeaves` matches the shipped Manual tree (including `R - Raw`, excluding inventing J/M/N/O/Q/W/Y).
- Free-typed Home on confirm is stored as given.

UI smoke (manual or light): File tab flow, Search tab, Browse tab, Tree visible for picking.

---

## Out of Scope (v1)

Keep as **future update ideas** (not abandoned — just not v1):

- Moving or copying files on disk  
- Confirming the file exists at the chosen home on disk  
- Searching device inventory CSVs / global catalog (~2.7M paths)  
- Auth, LAN bind, multi-user  
- Batch drop / confirm queue → **scheduled for v1.1** (explicit)  
- Reading file bytes / content hashing for suggestions  
- Replacing Shadow↔Shine sync or inventory tooling  

---

## Further Notes

### v1.1 (committed intent)

- **Batch drop/queue:** drop many files; confirm each (or accept defaults) using the same suggest → confirm → append path.

### Backlog seeds (from exclusions)

- Disk-confirm status on rows (`suggested` → `filed`)  
- Optional open/reveal path when drives are mounted  
- Inventory/CSV lookup as a separate tab or mode  
- Optional LAN + password  

### Glossary (project vocabulary)

| Term | Meaning |
| --- | --- |
| Personal Filing Directory | Edward’s A–Z content-type filing system |
| Manual leaf | Deepest defined home under a letter (e.g. A2 Work, C21 Animate) |
| Directory.md | App-local Markdown table of filing **intent** |
| Soft warning | Non-blocking notice that a filename already has a row |
| Shine / Shadow | Disk mirrors (E: / F:); **not** used by Filing Map v1 |

### Ready-for-agent

This spec is the durable record of the grill + `/to-spec` pass. **Do not implement until Edward (or the coordinator) explicitly asks to build.**
