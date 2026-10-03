(function (global) {
  const TABLE_HEADER = "| File | Home | Note |\n| --- | --- | --- |";

  function createEmptyDirectoryMarkdown() {
    return "# Directory\n\n" + TABLE_HEADER + "\n";
  }

  function escapeCell(value) {
    return String(value).replace(/\|/g, "\\|");
  }

  function unescapeCell(value) {
    return String(value).replace(/\\\|/g, "|");
  }

  function splitRow(line) {
    const inner = line.replace(/^\|/, "").replace(/\|$/, "");
    return inner.split("|").map(function (c) {
      return unescapeCell(c.trim());
    });
  }

  function parseDirectoryMarkdown(text) {
    const lines = String(text).split(/\r?\n/);
    const entries = [];
    let inTable = false;
    let rowIndex = 0;

    for (let i = 0; i < lines.length; i += 1) {
      const trimmed = lines[i].trim();
      if (/^\|\s*File\s*\|\s*Home\s*\|\s*Note\s*\|$/i.test(trimmed)) {
        inTable = true;
        continue;
      }
      if (inTable && /^\|\s*-+/.test(trimmed)) continue;
      if (inTable && trimmed.startsWith("|")) {
        const cells = splitRow(trimmed);
        if (cells.length >= 3) {
          const file = cells[0];
          const home = cells[1];
          const note = cells[2];
          if (file.toLowerCase() === "file") continue;
          entries.push({
            id: "row-" + rowIndex,
            file: file,
            home: home,
            note: note,
          });
          rowIndex += 1;
        }
      }
    }

    return entries;
  }

  function serializeDirectoryMarkdown(entries) {
    const rows = entries.map(function (e) {
      return (
        "| " +
        escapeCell(e.file) +
        " | " +
        escapeCell(e.home) +
        " | " +
        escapeCell(e.note) +
        " |"
      );
    });
    return (
      "# Directory\n\n" +
      TABLE_HEADER +
      "\n" +
      (rows.length ? rows.join("\n") + "\n" : "")
    );
  }

  global.FilingMap = global.FilingMap || {};
  global.FilingMap.createEmptyDirectoryMarkdown = createEmptyDirectoryMarkdown;
  global.FilingMap.parseDirectoryMarkdown = parseDirectoryMarkdown;
  global.FilingMap.serializeDirectoryMarkdown = serializeDirectoryMarkdown;
})(typeof window !== "undefined" ? window : globalThis);
