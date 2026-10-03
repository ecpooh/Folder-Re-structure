import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { console, globalThis: {} };
context.window = context;
context.globalThis = context;
vm.createContext(context);

for (const file of [
  "js/manual-tree.js",
  "js/directory-md.js",
  "js/rules.js",
  "js/store.js",
]) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(code, context, { filename: file });
}

const FM = context.FilingMap;
const store = FM.createStore();

const add = store.confirmAdd({
  file: "invoice-march.pdf",
  home: "F - Finance / F1 E-Bills",
  note: "Q1",
});
assert.equal(add.duplicateWarning, false);
assert.match(store.toMarkdown(), /\| invoice-march\.pdf \| F - Finance \/ F1 E-Bills \| Q1 \|/);

store.confirmAdd({ file: "odd.txt", home: "Somewhere / Custom" });
assert.match(store.toMarkdown(), /\| odd\.txt \| Somewhere \/ Custom \|  \|/);

const dup = store.confirmAdd({
  file: "invoice-march.pdf",
  home: "F - Finance",
  note: "again",
});
assert.equal(dup.duplicateWarning, true);

store.confirmAdd({
  file: "trip-itinerary.docx",
  home: "A - Productivity / A5 Travel",
  note: "Japan",
});
const hits = store.search("TRIP");
assert.equal(hits.length, 1);
assert.equal(hits[0].file, "trip-itinerary.docx");

const travel = store.suggest({ name: "flight-boarding.pdf", description: "travel itinerary" });
assert.equal(travel.unclear, false);
assert.equal(travel.suggestions[0].home, "A - Productivity / A5 Travel");

const unclear = store.suggest({ name: "mystery.bin" });
assert.equal(unclear.unclear, true);

const roundTrip = FM.parseDirectoryMarkdown(store.toMarkdown());
assert.ok(roundTrip.length >= 3);

const leaves = store.listManualLeaves();
assert.ok(leaves.some((l) => l.code === "R" && l.path === "R - Raw"));
assert.ok(!leaves.some((l) => l.code === "J"));
assert.ok(
  leaves.some((l) => l.path === "Somewhere / Custom"),
  "typed/imported home path should appear in tree leaves",
);

const nested = FM.leavesFromHomePath("F - Finance / F1 E-Bills / F11 Taxes");
assert.equal(nested.length, 3);
assert.equal(nested[2].path, "F - Finance / F1 E-Bills / F11 Taxes");
assert.equal(nested[2].parent, "F1");

const withImport = FM.mergeManualLeaves(FM.listManualLeaves(), [
  "F - Finance / F1 E-Bills / F11 Taxes",
  "Somewhere / Custom",
  "A - Productivity / A2 Work / A21 Code of Practice",
]);
assert.ok(withImport.some((l) => l.path === "F - Finance / F1 E-Bills / F11 Taxes"));
assert.ok(withImport.some((l) => l.path === "Somewhere"));
assert.ok(withImport.some((l) => l.path === "Somewhere / Custom"));

const aPaths = withImport
  .filter((l) => l.path === "A - Productivity" || l.path.indexOf("A - Productivity /") === 0)
  .map((l) => l.path);
assert.equal(
  JSON.stringify(aPaths),
  JSON.stringify([
    "A - Productivity",
    "A - Productivity / A1 Personal",
    "A - Productivity / A2 Work",
    "A - Productivity / A2 Work / A21 Code of Practice",
    "A - Productivity / A3 Study Material",
    "A - Productivity / A4 Exams",
    "A - Productivity / A4 Exams / A41 CPR",
    "A - Productivity / A5 Travel",
  ]),
);
const fIdx = withImport.findIndex((l) => l.path === "F - Finance / F1 E-Bills");
const f11Idx = withImport.findIndex(
  (l) => l.path === "F - Finance / F1 E-Bills / F11 Taxes",
);
assert.ok(fIdx >= 0 && f11Idx === fIdx + 1);
store.loadText(
  "# Directory\n\n| File | Home | Note |\n| --- | --- | --- |\n| a.pdf | K - Kreative / K1 Sketches | n |\n",
  "Directory2.md",
);
const afterImport = store.listManualLeaves();
assert.ok(afterImport.some((l) => l.path === "K - Kreative / K1 Sketches"));
assert.ok(afterImport.some((l) => l.parent === "K" && l.name === "Sketches"));

const ordered = FM.createStore();
ordered.confirmAdd({
  file: "cop.pdf",
  home: "A - Productivity / A2 Work / A21 Code of Practice",
});
ordered.confirmAdd({
  file: "travel.pdf",
  home: "A - Productivity / A5 Travel",
});
ordered.confirmAdd({
  file: "personal.pdf",
  home: "A - Productivity / A1 Personal",
});
ordered.confirmAdd({
  file: "work.pdf",
  home: "A - Productivity / A2 Work",
});
const orderedHomes = ordered.listEntries().map((e) => e.file + " => " + e.home);
assert.equal(
  JSON.stringify(orderedHomes),
  JSON.stringify([
    "personal.pdf => A - Productivity / A1 Personal",
    "work.pdf => A - Productivity / A2 Work",
    "cop.pdf => A - Productivity / A2 Work / A21 Code of Practice",
    "travel.pdf => A - Productivity / A5 Travel",
  ]),
);
assert.match(
  ordered.toMarkdown(),
  /A1 Personal[\s\S]*A2 Work \|[\s\S]*A21 Code of Practice[\s\S]*A5 Travel/,
);

console.log("smoke ok:", roundTrip.length, "entries,", leaves.length, "manual leaves");
