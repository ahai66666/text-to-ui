#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const indexPath = path.join(root, "skill-support/references/approved-pages/index.json");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
assert.equal(index.policy.defaultUse, "never");
assert.equal(index.policy.admission, "explicit-user-approval");
assert.equal(index.policy.generatedOutput, "not-a-reference");
assert.deepEqual(index.references, []);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-approved-page-reference-"));
const context = path.join(temp, "context.json");
let result = spawnSync(process.execPath, [path.join(root, "skill-support/scripts/resolve-context.mjs"), "--task", "tasks", "--framework", "html", "--mode", "fast-preview", "--confirmed", "--out", context], { cwd: root, encoding: "utf8" });
assert.equal(result.status, 0, result.stderr);
assert.deepEqual(JSON.parse(fs.readFileSync(context, "utf8")).approvedReferences, [], "ordinary generation must not load approved page references");
result = spawnSync(process.execPath, [path.join(root, "skill-support/scripts/resolve-context.mjs"), "--task", "tasks", "--framework", "html", "--mode", "fast-preview", "--confirmed", "--approved-reference", "unregistered-page"], { cwd: root, encoding: "utf8" });
assert.notEqual(result.status, 0, "an unregistered generated page must not be usable as a reference");
assert.match(result.stderr, /not found/);
fs.rmSync(temp, { recursive: true, force: true });
console.log("Approved page reference isolation policy tests passed.");
