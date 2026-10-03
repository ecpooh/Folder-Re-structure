# Filing Map

Localhost app that suggests Personal Filing Directory (A–Z) Manual leaf homes and remembers filing **intent** in a sibling `Directory.md` Markdown table.

Does **not** move files on disk. Does **not** verify the chosen home exists.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). Bound to `127.0.0.1` only; no auth.

## Optional AI suggestions

Set `FILING_MAP_AI_API_KEY` (OpenAI-compatible chat completions) for 2–3 AI Manual leaf options when rules are unclear. Without a key, rules + Manual picker / typed path still work.

## Tests

```bash
npm test
```

Primary seam: `FilingDirectory` (`suggest`, `confirmAdd`, `search`, `listEntries`, `update`, `remove`, `listManualLeaves`).

## Spec & tickets

See Project store:

- `docs/filing-map-spec.md`
- `docs/filing-map-tickets/`
