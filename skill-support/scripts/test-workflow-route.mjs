#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(scripts, "../..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-workflow-routes-"));
const resolve = (route, receipt) => spawnSync(process.execPath, [path.join(scripts, "resolve-workflow-route.mjs"), "--route", route, "--repo", repo, "--receipt-out", receipt], { cwd: repo, encoding: "utf8" });
for (const route of ["existing-html-to-pixso", "new-page", "micro-revision", "pixso-component-library", "converter-diagnosis", "skill-maintenance"]) {
  const receipt = path.join(temp, `${route}.json`);
  const result = resolve(route, receipt);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.routeId, route);
  assert.ok(payload.exactReferencesToRead.length >= 1);
  const verified = spawnSync(process.execPath, [path.join(scripts, "verify-route-materials.mjs"), "--route", route, "--repo", repo, "--receipt", receipt], { cwd: repo, encoding: "utf8" });
  assert.equal(verified.status, 0, `${route} material receipt failed: ${verified.stderr}`);
}
const normalReceipt = path.join(temp, "existing-html-to-pixso-repeat.json");
const normal = JSON.parse(resolve("existing-html-to-pixso", normalReceipt).stdout);
assert.deepEqual(normal.exactReferencesToRead.map((entry) => entry.relative), ["references/routes/existing-html-to-pixso.md"]);
assert.equal(normal.exactReferencesToRead.some((entry) => /pixso-(?:mcp|native-scene|fidelity-import-pipeline)/.test(entry.relative)), false, "normal import must not load broad diagnostic manuals");
const invalid = resolve("unknown", path.join(temp, "invalid.json"));
assert.notEqual(invalid.status, 0);
fs.rmSync(temp, { recursive: true, force: true });
console.log("Workflow route tests passed: each request resolves to one small route and normal HTML import loads no broad Pixso manual.");
