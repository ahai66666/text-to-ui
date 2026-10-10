#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const query = (...args) => {
  const result = spawnSync(process.execPath, [path.join(root, "skill-support/scripts/query-components.mjs"), "--repo", root, "--framework", "html", ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).results[0];
};

const search = query("--capabilities", "search", "--context", "secondary-list-search");
assert.equal(search.logicalName, "Search/White Surface/Default");
assert.equal(search.selection.requiredOptions.surface, "white");
const primary = query("--capabilities", "button", "--context", "page-primary-action");
assert.equal(primary.logicalName, "Button/Primary/Default");
assert.equal(primary.selection.requiredOptions.variant, "primary");
assert.equal(primary.readiness.level, "provisional");
const ambiguous = query("--capabilities", "button");
assert.equal(ambiguous.resolution, "context-required");
const broadInput = query("--capabilities", "input");
assert.equal(broadInput.resolution, "context-required");
assert.ok(broadInput.candidates.includes("Number Selector/Default"));
const wrongContext = query("--capabilities", "search", "--context", "toolbar-action");
assert.equal(wrongContext.resolution, "context-mismatch");
console.log("Component semantic selection rules passed.");
