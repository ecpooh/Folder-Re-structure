# Filing Map

Static page that suggests Personal Filing Directory (A–Z) Manual leaf homes and remembers filing **intent** in a `Directory.md` Markdown table.

Does **not** move files on disk. Does **not** verify the chosen home exists. No install.

## Quick start (`run.zip`)

1. Download [`run.zip`](./run.zip) from this repo.
2. Unzip into **any** folder (Desktop, Downloads, USB — anywhere).
3. Open that folder and double-click `index.html` (or right-click → Open with Chrome / Edge / Firefox).

Keep the unzipped folder together (`index.html`, `css/`, `js/`, `Directory.md`). Do not open a drive root like `E:\` as the app folder.

Optional fonts load from Google Fonts when online; the app still works offline without them.

## Directory.md workflow

1. **Import Directory.md** — load your existing table (or start with **New empty**).
2. Use **File / Search / Browse / Tree** as before. Confirms stay **in memory**.
3. **Export** — download the updated `Directory.md`, or **Save** to write back to the same file when the browser supports the File System Access API (Chrome/Edge after Import via that picker).

Unsaved changes show a yellow dot and warn if you close the tab.

## Optional local server

If your browser restricts `file://`:

```bash
cd path/to/unzipped-folder
python3 -m http.server 43123 --bind 127.0.0.1
```

Then open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## What’s in `run.zip`

- `index.html`
- `css/styles.css`
- `js/` (`app.js`, `directory-md.js`, `manual-tree.js`, `rules.js`, `store.js`)
- `Directory.md` (starter table)
- `README.md` (this file)
