# Filing Map

Static localhost page that suggests Personal Filing Directory (A–Z) Manual leaf homes and remembers filing **intent** in a `Directory.md` Markdown table.

Does **not** move files on disk. Does **not** verify the chosen home exists.

## Run (no install)

1. Open the repo folder (the one that contains `index.html` — not a drive root like `E:\`).
2. Double-click `index.html`, or right-click → Open with your browser.

Chrome / Edge / Firefox all work. Optional fonts load from Google Fonts when online; the app still works offline without them.

## Directory.md workflow

1. **Import Directory.md** — load your existing table (or start with **New empty**).
2. Use **File / Search / Browse / Tree** as before. Confirms stay **in memory**.
3. **Export** — download the updated `Directory.md`, or **Save** to write back to the same file when the browser supports the File System Access API (Chrome/Edge after Import via that picker).

Unsaved changes show a yellow dot and warn if you close the tab.

## Optional local server

If your browser restricts `file://` for any reason:

```bash
cd path/to/Folder-Re-structure
python3 -m http.server 43123 --bind 127.0.0.1
```

Then open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Spec & tickets

See Project store:

- `docs/filing-map-spec.md`
- `docs/filing-map-tickets/`
