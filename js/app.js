(function () {
  const store = FilingMap.createStore();

  const state = {
    tab: "file",
    fileName: "",
    description: "",
    home: "",
    note: "",
    suggestions: [],
    unclear: false,
    duplicateWarning: false,
    status: null,
    error: null,
    query: "",
    searchHits: [],
    editingId: null,
    editDraft: {},
  };

  const el = {
    dirty: document.getElementById("dirty-indicator"),
    meta: document.getElementById("source-meta"),
    error: document.getElementById("alert-error"),
    status: document.getElementById("alert-status"),
    dup: document.getElementById("alert-dup"),
    tabs: document.querySelectorAll("[data-tab]"),
    panels: {
      file: document.getElementById("panel-file"),
      search: document.getElementById("panel-search"),
      browse: document.getElementById("panel-browse"),
      tree: document.getElementById("panel-tree"),
    },
    fileName: document.getElementById("file-name"),
    description: document.getElementById("description"),
    home: document.getElementById("home"),
    note: document.getElementById("note"),
    suggestions: document.getElementById("suggestions"),
    unclear: document.getElementById("unclear"),
    leafList: document.getElementById("leaf-datalist"),
    pickList: document.getElementById("pick-list"),
    drop: document.getElementById("drop-zone"),
    query: document.getElementById("search-query"),
    searchList: document.getElementById("search-list"),
    browseList: document.getElementById("browse-list"),
    browseCount: document.getElementById("browse-count"),
    treeList: document.getElementById("tree-list"),
    importInput: document.getElementById("import-input"),
  };

  function setStatus(msg) {
    state.status = msg;
    state.error = null;
    renderAlerts();
  }

  function setError(msg) {
    state.error = msg;
    renderAlerts();
  }

  function renderAlerts() {
    el.error.classList.toggle("hidden", !state.error);
    el.error.textContent = state.error || "";
    el.status.classList.toggle("hidden", !state.status);
    el.status.textContent = state.status || "";
    el.dup.classList.toggle("hidden", !state.duplicateWarning);
  }

  function renderToolbar() {
    el.dirty.classList.toggle("hidden", !store.isDirty());
    const handleHint = store.getFileHandle() ? " · can Save in place" : "";
    el.meta.textContent =
      store.getSourceName() +
      " · " +
      store.listEntries().length +
      " row(s)" +
      (store.isDirty() ? " · unsaved" : "") +
      handleHint;
  }

  function renderTabs() {
    el.tabs.forEach(function (btn) {
      const id = btn.getAttribute("data-tab");
      btn.classList.toggle("tab-active", id === state.tab);
    });
    Object.keys(el.panels).forEach(function (id) {
      el.panels[id].classList.toggle("hidden", id !== state.tab);
    });
  }

  function renderSuggestions() {
    el.unclear.classList.toggle("hidden", !state.unclear);
    el.suggestions.innerHTML = "";
    state.suggestions.forEach(function (s) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggestion";
      btn.innerHTML =
        "<span class=\"entry-title\">" +
        escapeHtml(s.home) +
        "</span>" +
        "<span class=\"badge\">" +
        escapeHtml(s.source) +
        (s.strength === "strong" ? " · strong" : "") +
        "</span>" +
        (s.reason
          ? "<span class=\"entry-home\">" + escapeHtml(s.reason) + "</span>"
          : "");
      btn.addEventListener("click", function () {
        state.home = s.home;
        el.home.value = s.home;
      });
      li.appendChild(btn);
      el.suggestions.appendChild(li);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderEntryList(target, entries, emptyLabel) {
    target.innerHTML = "";
    if (!entries.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = emptyLabel;
      target.appendChild(p);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "list";
    entries.forEach(function (entry) {
      const li = document.createElement("li");
      li.className = "list-item panel";
      if (state.editingId === entry.id) {
        li.innerHTML =
          '<div class="stack-sm">' +
          '<input class="field" data-edit="file" aria-label="File" />' +
          '<input class="field" data-edit="home" aria-label="Home" list="leaf-datalist" />' +
          '<input class="field" data-edit="note" aria-label="Note" />' +
          '<div class="row">' +
          '<button type="button" class="btn" data-action="save-edit">Save</button>' +
          '<button type="button" class="btn-quiet" data-action="cancel-edit">Cancel</button>' +
          "</div></div>";
        li.querySelector('[data-edit="file"]').value =
          state.editDraft.file != null ? state.editDraft.file : entry.file;
        li.querySelector('[data-edit="home"]').value =
          state.editDraft.home != null ? state.editDraft.home : entry.home;
        li.querySelector('[data-edit="note"]').value =
          state.editDraft.note != null ? state.editDraft.note : entry.note;
        li.querySelectorAll("[data-edit]").forEach(function (input) {
          input.addEventListener("input", function () {
            state.editDraft[input.getAttribute("data-edit")] = input.value;
          });
        });
        li.querySelector('[data-action="save-edit"]').addEventListener(
          "click",
          function () {
            try {
              store.update(entry.id, state.editDraft);
              state.editingId = null;
              state.editDraft = {};
              setStatus("Row updated. Export Directory.md when ready.");
              refreshLists();
            } catch (err) {
              setError(err.message || "Update failed");
            }
          },
        );
        li.querySelector('[data-action="cancel-edit"]').addEventListener(
          "click",
          function () {
            state.editingId = null;
            state.editDraft = {};
            refreshLists();
          },
        );
      } else {
        li.innerHTML =
          '<div class="row-between">' +
          "<div>" +
          '<p class="entry-title"></p>' +
          '<p class="entry-home"></p>' +
          '<p class="entry-note"></p>' +
          "</div>" +
          '<div class="row">' +
          '<button type="button" class="btn-quiet" data-action="edit">Edit</button>' +
          '<button type="button" class="btn-quiet" data-action="delete">Delete</button>' +
          "</div></div>";
        li.querySelector(".entry-title").textContent = entry.file;
        li.querySelector(".entry-home").textContent = entry.home;
        const noteEl = li.querySelector(".entry-note");
        if (entry.note) noteEl.textContent = entry.note;
        else noteEl.remove();
        li.querySelector('[data-action="edit"]').addEventListener(
          "click",
          function () {
            state.editingId = entry.id;
            state.editDraft = {
              file: entry.file,
              home: entry.home,
              note: entry.note,
            };
            refreshLists();
          },
        );
        li.querySelector('[data-action="delete"]').addEventListener(
          "click",
          function () {
            try {
              store.remove(entry.id);
              setStatus("Row deleted. Export Directory.md when ready.");
              refreshLists();
            } catch (err) {
              setError(err.message || "Delete failed");
            }
          },
        );
      }
      ul.appendChild(li);
    });
    target.appendChild(ul);
  }

  function refreshLists() {
    renderToolbar();
    renderAlerts();
    fillLeavesUi();
    if (state.tab === "search") {
      renderEntryList(
        el.searchList,
        state.searchHits,
        "No matches yet. Run a search.",
      );
    }
    if (state.tab === "browse") {
      const all = store.listEntries();
      el.browseCount.textContent = all.length + " row(s) in memory";
      renderEntryList(el.browseList, all, "No rows yet. Import or confirm a filing.");
    }
  }

  function fillLeavesUi() {
    const leaves = store.listManualLeaves();
    el.leafList.innerHTML = "";
    el.pickList.innerHTML = "";
    leaves.forEach(function (leaf) {
      const opt = document.createElement("option");
      opt.value = leaf.path;
      el.leafList.appendChild(opt);

      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = leaf.path;
      btn.addEventListener("click", function () {
        state.home = leaf.path;
        el.home.value = leaf.path;
      });
      li.appendChild(btn);
      el.pickList.appendChild(li);
    });

    el.treeList.innerHTML = "";
    leaves
      .filter(function (l) {
        return !l.parent;
      })
      .forEach(function (top) {
        const li = document.createElement("li");
        const title = document.createElement("p");
        title.className = "display";
        title.style.fontSize = "1.125rem";
        title.textContent = top.path;
        const ul = document.createElement("ul");
        ul.className = "tree-branch";
        leaves
          .filter(function (l) {
            return l.path.indexOf(top.path + " /") === 0 || l.code === top.code;
          })
          .forEach(function (l) {
            const child = document.createElement("li");
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = l.path;
            btn.addEventListener("click", function () {
              state.home = l.path;
              el.home.value = l.path;
              state.tab = "file";
              renderTabs();
            });
            child.appendChild(btn);
            ul.appendChild(child);
          });
        li.appendChild(title);
        li.appendChild(ul);
        el.treeList.appendChild(li);
      });
  }

  async function importFile(file) {
    const text = await file.text();
    store.loadText(text, file.name || "Directory.md");
    store.setFileHandle(null);
    state.duplicateWarning = false;
    state.searchHits = [];
    setStatus("Imported " + store.getSourceName() + ".");
    refreshLists();
  }

  async function importWithPicker() {
    if (window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "Markdown",
              accept: { "text/markdown": [".md"], "text/plain": [".md", ".txt"] },
            },
          ],
        });
        const handle = handles[0];
        const file = await handle.getFile();
        const text = await file.text();
        store.loadText(text, file.name || "Directory.md");
        store.setFileHandle(handle);
        state.duplicateWarning = false;
        state.searchHits = [];
        setStatus("Imported " + store.getSourceName() + " (Save can write back).");
        refreshLists();
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
        // fall through to input
      }
    }
    el.importInput.click();
  }

  function downloadMarkdown() {
    const text = store.toMarkdown();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = store.getSourceName() || "Directory.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    store.clearDirty();
    setStatus("Exported " + store.getSourceName() + ".");
    renderToolbar();
  }

  async function saveInPlace() {
    const handle = store.getFileHandle();
    if (!handle || !handle.createWritable) {
      downloadMarkdown();
      return;
    }
    try {
      const writable = await handle.createWritable();
      await writable.write(store.toMarkdown());
      await writable.close();
      store.clearDirty();
      setStatus("Saved " + store.getSourceName() + " in place.");
      renderToolbar();
    } catch (err) {
      setError(err.message || "Save failed; try Export instead.");
    }
  }

  function onDropFile(file) {
    if (!file) return;
    state.fileName = file.name;
    el.fileName.value = file.name;
    setStatus('Using name/extension from “' + file.name + '” (contents ignored).');
  }

  document.getElementById("btn-import").addEventListener("click", function () {
    void importWithPicker();
  });
  document.getElementById("btn-export").addEventListener("click", downloadMarkdown);
  document.getElementById("btn-save").addEventListener("click", function () {
    void saveInPlace();
  });
  document.getElementById("btn-new").addEventListener("click", function () {
    if (store.isDirty() && !window.confirm("Discard unsaved changes?")) return;
    store.loadText(FilingMap.createEmptyDirectoryMarkdown(), "Directory.md");
    store.setFileHandle(null);
    state.duplicateWarning = false;
    state.searchHits = [];
    setStatus("Started a new empty Directory.md in memory.");
    refreshLists();
  });

  el.importInput.addEventListener("change", function () {
    const file = el.importInput.files && el.importInput.files[0];
    if (file) void importFile(file);
    el.importInput.value = "";
  });

  el.tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.tab = btn.getAttribute("data-tab");
      renderTabs();
      refreshLists();
    });
  });

  el.fileName.addEventListener("input", function () {
    state.fileName = el.fileName.value;
  });
  el.description.addEventListener("input", function () {
    state.description = el.description.value;
  });
  el.home.addEventListener("input", function () {
    state.home = el.home.value;
  });
  el.note.addEventListener("input", function () {
    state.note = el.note.value;
  });
  el.query.addEventListener("input", function () {
    state.query = el.query.value;
  });
  el.query.addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("btn-search").click();
  });

  el.drop.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  el.drop.addEventListener("drop", function (e) {
    e.preventDefault();
    onDropFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  document.getElementById("choose-file").addEventListener("change", function (e) {
    onDropFile(e.target.files && e.target.files[0]);
    e.target.value = "";
  });

  document.getElementById("btn-suggest").addEventListener("click", function () {
    state.error = null;
    state.status = null;
    if (!state.fileName.trim()) {
      setError("Enter or drop a filename first.");
      return;
    }
    const result = store.suggest({
      name: state.fileName,
      description: state.description,
    });
    state.suggestions = result.suggestions;
    state.unclear = result.unclear;
    if (result.suggestions[0] && result.suggestions[0].strength === "strong") {
      state.home = result.suggestions[0].home;
      el.home.value = state.home;
    }
    renderSuggestions();
    renderAlerts();
  });

  document.getElementById("btn-confirm").addEventListener("click", function () {
    state.error = null;
    state.duplicateWarning = false;
    try {
      const result = store.confirmAdd({
        file: state.fileName,
        home: state.home,
        note: state.note,
      });
      state.duplicateWarning = result.duplicateWarning;
      state.note = "";
      el.note.value = "";
      setStatus(
        "Saved intent in memory: " +
          state.fileName +
          " → " +
          state.home +
          ". Export Directory.md when ready.",
      );
      refreshLists();
    } catch (err) {
      setError(err.message || "Confirm failed");
    }
  });

  document.getElementById("btn-search").addEventListener("click", function () {
    state.searchHits = store.search(state.query);
    refreshLists();
  });

  document.getElementById("btn-browse-refresh").addEventListener("click", function () {
    refreshLists();
  });

  window.addEventListener("beforeunload", function (e) {
    if (!store.isDirty()) return;
    e.preventDefault();
    e.returnValue = "";
  });

  renderTabs();
  renderSuggestions();
  refreshLists();
})();
