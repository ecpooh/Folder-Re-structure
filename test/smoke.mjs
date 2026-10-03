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

console.log("smoke ok:", roundTrip.length, "entries,", leaves.length, "manual leaves");
