"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "file" | "search" | "browse" | "tree";

type Suggestion = {
  home: string;
  source: "rule" | "ai";
  strength: "strong" | "candidate";
  reason?: string;
};

type Entry = {
  id: string;
  file: string;
  home: string;
  note: string;
};

type ManualLeaf = {
  code: string;
  name: string;
  path: string;
  parent?: string;
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("file");
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [home, setHome] = useState("");
  const [note, setNote] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unclear, setUnclear] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [leaves, setLeaves] = useState<ManualLeaf[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Entry>>({});

  const loadLeaves = useCallback(async () => {
    const res = await fetch("/api/tree");
    const data = (await res.json()) as { leaves: ManualLeaf[] };
    setLeaves(data.leaves);
  }, []);

  const loadAll = useCallback(async () => {
    const res = await fetch("/api/entries");
    const data = (await res.json()) as { entries: Entry[] };
    setAllEntries(data.entries);
  }, []);

  useEffect(() => {
    void loadLeaves();
  }, [loadLeaves]);

  useEffect(() => {
    if (tab === "browse") void loadAll();
  }, [tab, loadAll]);

  const topLevelLeaves = useMemo(
    () => leaves.filter((l) => !l.parent),
    [leaves],
  );

  async function onDropFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    setStatus(`Using name/extension from “${file.name}” (contents ignored).`);
  }

  async function runSuggest() {
    setError(null);
    setStatus(null);
    if (!fileName.trim()) {
      setError("Enter or drop a filename first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fileName, description }),
      });
      const data = (await res.json()) as {
        suggestions: Suggestion[];
        unclear: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Suggest failed");
      setSuggestions(data.suggestions);
      setUnclear(data.unclear);
      if (data.suggestions[0]?.strength === "strong") {
        setHome(data.suggestions[0].home);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suggest failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAdd() {
    setError(null);
    setDuplicateWarning(false);
    setStatus(null);
    if (!fileName.trim() || !home.trim()) {
      setError("File and Home are required before confirm.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: fileName, home, note }),
      });
      const data = (await res.json()) as {
        duplicateWarning?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Confirm failed");
      setDuplicateWarning(Boolean(data.duplicateWarning));
      setStatus(`Saved intent: ${fileName} → ${home}`);
      setNote("");
      if (tab === "browse") await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setBusy(false);
    }
  }

  async function runSearch() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/entries?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { entries: Entry[] };
      setSearchHits(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editDraft }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setEditingId(null);
      setEditDraft({});
      await runSearch();
      await loadAll();
      setStatus("Row updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await runSearch();
      await loadAll();
      setStatus("Row deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function renderEntryList(entries: Entry[], emptyLabel: string) {
    if (entries.length === 0) {
      return <p className="text-muted text-sm">{emptyLabel}</p>;
    }
    return (
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => {
          const editing = editingId === entry.id;
          return (
            <li
              key={entry.id}
              className="border border-line bg-panel px-4 py-3"
            >
              {editing ? (
                <div className="flex flex-col gap-2">
                  <input
                    className="field"
                    value={editDraft.file ?? entry.file}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, file: e.target.value }))
                    }
                    aria-label="File"
                  />
                  <input
                    className="field"
                    value={editDraft.home ?? entry.home}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, home: e.target.value }))
                    }
                    aria-label="Home"
                  />
                  <input
                    className="field"
                    value={editDraft.note ?? entry.note}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, note: e.target.value }))
                    }
                    aria-label="Note"
                  />
                  <div className="flex gap-2">
                    <button type="button" className="btn" onClick={() => void saveEdit()} disabled={busy}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-quiet"
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{entry.file}</p>
                    <p className="text-sm text-muted">{entry.home}</p>
                    {entry.note ? (
                      <p className="text-sm text-muted italic">{entry.note}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-quiet"
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditDraft({
                          file: entry.file,
                          home: entry.home,
                          note: entry.note,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-quiet"
                      onClick={() => void deleteEntry(entry.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Localhost</p>
        <h1 className="display text-4xl text-ink sm:text-5xl">Filing Map</h1>
        <p className="max-w-xl text-muted">
          Suggest Manual leaf homes, confirm filing intent, and keep it in{" "}
          <code className="text-ink">Directory.md</code>. Nothing moves on disk.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-line pb-3" aria-label="Sections">
        {(
          [
            ["file", "File"],
            ["search", "Search"],
            ["browse", "Browse"],
            ["tree", "Tree"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "tab tab-active" : "tab"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error ? (
        <div className="border border-warn bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="border border-line bg-accent-soft px-4 py-3 text-sm text-accent">
          {status}
        </div>
      ) : null}
      {duplicateWarning ? (
        <div className="border border-warn bg-warn-soft px-4 py-3 text-sm text-warn">
          Soft warning: that filename already has a row in Directory.md. Another row was still added.
        </div>
      ) : null}

      {tab === "file" ? (
        <section className="flex flex-col gap-6" aria-label="File one item">
          <div
            className="flex flex-col items-center justify-center gap-2 border border-dashed border-line bg-panel px-4 py-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0] ?? null;
              void onDropFile(f);
            }}
          >
            <p className="text-sm text-muted">Drop one file (name/extension only) or type below</p>
            <label className="btn-quiet cursor-pointer">
              Choose file
              <input
                type="file"
                className="sr-only"
                onChange={(e) => void onDropFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Filename</span>
            <input
              className="field"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="invoice-march.pdf"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Description (optional)</span>
            <textarea
              className="field min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Personal e-bill for March"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => void runSuggest()} disabled={busy}>
              Suggest homes
            </button>
          </div>

          {unclear ? (
            <p className="text-sm text-muted">
              Rules are unclear. Pick a Manual leaf, type a path, or use AI options if an API key is set.
            </p>
          ) : null}

          {suggestions.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <li key={`${s.source}-${s.home}`}>
                  <button
                    type="button"
                    className="w-full border border-line bg-panel px-3 py-2 text-left hover:border-accent"
                    onClick={() => setHome(s.home)}
                  >
                    <span className="font-medium">{s.home}</span>
                    <span className="ml-2 text-xs uppercase tracking-wide text-muted">
                      {s.source}
                      {s.strength === "strong" ? " · strong" : ""}
                    </span>
                    {s.reason ? (
                      <span className="mt-1 block text-sm text-muted">{s.reason}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Home (accept, pick, or type any path)</span>
            <input
              className="field"
              value={home}
              onChange={(e) => setHome(e.target.value)}
              placeholder="F - Finance / F1 E-Bills"
              list="manual-leaves"
            />
            <datalist id="manual-leaves">
              {leaves.map((l) => (
                <option key={l.path} value={l.path} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Note (optional)</span>
            <input
              className="field"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional one-line note"
            />
          </label>

          <button type="button" className="btn" onClick={() => void confirmAdd()} disabled={busy}>
            Confirm & append to Directory.md
          </button>

          <details className="border border-line bg-panel px-4 py-3">
            <summary className="cursor-pointer font-medium">Pick from Manual tree</summary>
            <ul className="mt-3 max-h-64 overflow-auto text-sm">
              {leaves.map((l) => (
                <li key={l.path}>
                  <button
                    type="button"
                    className="w-full px-1 py-1 text-left hover:bg-accent-soft"
                    onClick={() => setHome(l.path)}
                  >
                    {l.path}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}

      {tab === "search" ? (
        <section className="flex flex-col gap-4" aria-label="Search filings">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="field flex-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Part of a filename"
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch();
              }}
            />
            <button type="button" className="btn" onClick={() => void runSearch()} disabled={busy}>
              Search
            </button>
          </div>
          {renderEntryList(searchHits, "No matches yet. Run a search.")}
        </section>
      ) : null}

      {tab === "browse" ? (
        <section className="flex flex-col gap-4" aria-label="Browse all filings">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{allEntries.length} row(s) in Directory.md</p>
            <button type="button" className="btn-quiet" onClick={() => void loadAll()} disabled={busy}>
              Refresh
            </button>
          </div>
          {renderEntryList(allEntries, "Directory.md has no rows yet.")}
        </section>
      ) : null}

      {tab === "tree" ? (
        <section className="flex flex-col gap-4" aria-label="Manual filing tree">
          <p className="text-sm text-muted">
            Official Manual leaves for reference. Confirm still allows any typed path.
          </p>
          <ul className="flex flex-col gap-4">
            {topLevelLeaves.map((top) => (
              <li key={top.code}>
                <p className="display text-lg text-ink">{top.path}</p>
                <ul className="mt-1 border-l border-line pl-3 text-sm text-muted">
                  {leaves
                    .filter((l) => l.path.startsWith(`${top.path} /`) || l.code === top.code)
                    .map((l) => (
                      <li key={l.path} className="py-0.5">
                        <button
                          type="button"
                          className="hover:text-accent"
                          onClick={() => {
                            setHome(l.path);
                            setTab("file");
                          }}
                        >
                          {l.path}
                        </button>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

    </div>
  );
}
