#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const verifier = path.join(scriptDir, "verify-html-artifact.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-html-"));
const assetPath = path.join(tempDir, "styles.css");
const goodPath = path.join(tempDir, "good.html");
const badPath = path.join(tempDir, "bad.html");

fs.writeFileSync(assetPath, "body { color: var(--color-text); }");
fs.writeFileSync(
  goodPath,
  '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body>OK</body></html>',
);
fs.writeFileSync(
  badPath,
  '<!doctype html><html><head><script src="missing.js"></script></head><body>Broken</body></html>',
);

const good = spawnSync(process.execPath, [verifier, goodPath], {
  encoding: "utf8",
});
assert.equal(good.status, 0, good.stderr);
assert.equal(JSON.parse(good.stdout).status, "verified");

const bad = spawnSync(process.execPath, [verifier, badPath], {
  encoding: "utf8",
});
assert.equal(bad.status, 1);
assert.equal(JSON.parse(bad.stdout).status, "failed");
assert.equal(JSON.parse(bad.stdout).missingReferences.length, 1);

console.log("HTML artifact verifier tests passed.");
