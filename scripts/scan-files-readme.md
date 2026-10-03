# scan-files — drive / folder file inventory

Creates timestamped CSV part files listing every file under a chosen root. Read-only: it never deletes, moves, or renames your files. No admin rights required.

## Files

Keep these two together (same folder):

- `scan-files.bat` — double-click launcher / CLI entry
- `scan-files.ps1` — scan logic (streamed multi-part CSV via PowerShell)

## How to run

1. Copy both files to the top of the tree you want inventoried (e.g. `D:\`, or an external drive root, or any parent folder).
2. Double-click `scan-files.bat`, **or** open cmd in that folder and run:

```bat
scan-files.bat
```

Optional root argument (script can live elsewhere):

```bat
scan-files.bat "D:\"
scan-files.bat "E:\Backup\Photos"
```

Default root when no argument is given: the folder containing the script (`cd /d "%~dp0"`).

## Output

Writes into the scan root as numbered parts, each under **~8 MB** (rolls before the next row would exceed `8 * 1024 * 1024` bytes):

```text
file-inventory-YYYYMMDD-HHMMSS-part001.csv
file-inventory-YYYYMMDD-HHMMSS-part002.csv
…
```

Every part starts with the same CSV header row. Timestamped so re-runs do not overwrite a previous inventory. Prior inventory CSVs in the tree (`file-inventory-*.csv`, `_file-inventory.csv`) are skipped (not listed as rows), including these parts.

### CSV columns

Lean header on every part:

```text
FullPath,SizeBytes,LastWriteTime
```

| Column | Meaning |
|--------|---------|
| `FullPath` | Full absolute path to the file |
| `SizeBytes` | Size in bytes |
| `LastWriteTime` | Last modified time (`yyyy-MM-dd HH:mm:ss`, local) |

`FileName` / `Directory` / `Extension` are omitted (derivable from `FullPath`). Paths are CSV-quoted so commas and quotes in names are safe.

## Progress

Console prints a running count and the active part number about every 5 seconds (or every 5000 files). At the end it reports total files listed and how many parts were written. CSVs are flushed as they go — suitable for large trees (multi-TB / millions of files) without loading the whole list into memory.

## Limitations

- **Windows only** (uses `cmd` + Windows PowerShell).
- **Access-denied folders** are skipped quietly; those files will be missing from the CSV. Running elevated can see more system locations, but elevation is not required and not recommended for normal personal drives.
- **Very long paths** beyond legacy MAX_PATH may be missing unless long-path support is enabled on that PC.
- **Reparse points / symlinks / junctions** follow PowerShell/`Get-ChildItem` defaults; unusual link layouts can duplicate or omit entries.
- **One row per file** — empty directories are not listed.
- Inventory files named `file-inventory-*.csv` or `_file-inventory.csv` are excluded from results so re-scans stay clean.
- A single CSV row longer than 8 MB is still written (rare); the next row starts a new part.

## Drive-root quoting (fixed)

Do **not** hand-roll `powershell … -Root "H:\" -OutBase "…"`. In `cmd`, a trailing `\` before the closing quote escapes that quote, so `-OutBase` is swallowed and PowerShell prompts for parameters. The `.bat` strips a trailing `\` from the root before calling PowerShell (`H:\` → `H:`; `D:\Some Folder\` → `D:\Some Folder`), so double-click / `scan-files.bat "H:\"` never prompts.

## Safety

- Does not modify, move, or delete anything except creating the new CSV part files in the scan root.
- Does not require network access or admin.
