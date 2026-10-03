(function (global) {
  const FM = global.FilingMap;

  function createStore(initialText) {
    let entries = FM.parseDirectoryMarkdown(
      initialText || FM.createEmptyDirectoryMarkdown(),
    );
    let dirty = false;
    let fileHandle = null;
    let sourceName = "Directory.md";

    function sortEntries() {
      entries.sort(function (a, b) {
        const byHome = FM.compareLeafPaths(a.home, b.home);
        if (byHome !== 0) return byHome;
        const byFile = String(a.file).localeCompare(String(b.file), undefined, {
          sensitivity: "base",
        });
        if (byFile !== 0) return byFile;
        return String(a.note || "").localeCompare(String(b.note || ""), undefined, {
          sensitivity: "base",
        });
      });
    }

    function normalize() {
      sortEntries();
      entries = entries.map(function (e, i) {
        return {
          id: "row-" + i,
          file: e.file,
          home: e.home,
          note: e.note,
        };
      });
    }

    function markDirty() {
      dirty = true;
    }

    return {
      isDirty: function () {
        return dirty;
      },
      clearDirty: function () {
        dirty = false;
      },
      getSourceName: function () {
        return sourceName;
      },
      setSourceName: function (name) {
        sourceName = name || "Directory.md";
      },
      getFileHandle: function () {
        return fileHandle;
      },
      setFileHandle: function (handle) {
        fileHandle = handle || null;
      },
      listEntries: function () {
        return entries.map(function (e) {
          return Object.assign({}, e);
        });
      },
      loadText: function (text, name) {
        entries = FM.parseDirectoryMarkdown(text);
        normalize();
        dirty = false;
        if (name) sourceName = name;
      },
      toMarkdown: function () {
        normalize();
        return FM.serializeDirectoryMarkdown(entries);
      },
      confirmAdd: function (input) {
        const file = String(input.file || "").trim();
        const home = String(input.home || "").trim();
        const note = String(input.note || "").trim();
        if (!file) throw new Error("File is required");
        if (!home) throw new Error("Home is required");
        const duplicateWarning = entries.some(function (e) {
          return e.file.toLowerCase() === file.toLowerCase();
        });
        entries.push({
          id: "row-" + entries.length,
          file: file,
          home: home,
          note: note,
        });
        normalize();
        markDirty();
        const entry =
          entries.find(function (e) {
            return e.file === file && e.home === home && e.note === note;
          }) || entries[entries.length - 1];
        return {
          entry: Object.assign({}, entry),
          duplicateWarning: duplicateWarning,
        };
      },
      search: function (query) {
        const q = String(query || "")
          .trim()
          .toLowerCase();
        const all = this.listEntries();
        if (!q) return all;
        return all.filter(function (e) {
          return e.file.toLowerCase().includes(q);
        });
      },
      update: function (id, fields) {
        const index = entries.findIndex(function (e) {
          return e.id === id;
        });
        if (index < 0) throw new Error("Entry not found: " + id);
        const current = entries[index];
        const updated = {
          id: current.id,
          file:
            fields.file !== undefined ? String(fields.file).trim() : current.file,
          home:
            fields.home !== undefined ? String(fields.home).trim() : current.home,
          note:
            fields.note !== undefined ? String(fields.note).trim() : current.note,
        };
        if (!updated.file) throw new Error("File is required");
        if (!updated.home) throw new Error("Home is required");
        entries[index] = updated;
        normalize();
        markDirty();
        const entry =
          entries.find(function (e) {
            return (
              e.file === updated.file &&
              e.home === updated.home &&
              e.note === updated.note
            );
          }) || updated;
        return Object.assign({}, entry);
      },
      remove: function (id) {
        const next = entries.filter(function (e) {
          return e.id !== id;
        });
        if (next.length === entries.length) {
          throw new Error("Entry not found: " + id);
        }
        entries = next;
        normalize();
        markDirty();
      },
      suggest: function (input) {
        return FM.suggestFromRules(input);
      },
      listManualLeaves: function () {
        return FM.listManualLeaves(
          entries.map(function (entry) {
            return entry.home;
          }),
        );
      },
    };
  }

  global.FilingMap.createStore = createStore;
})(typeof window !== "undefined" ? window : globalThis);
