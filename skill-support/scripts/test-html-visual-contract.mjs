#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { computeHtmlSourceFingerprint, validateFreshHtmlVisualSnapshot } from "./html-visual-contract.mjs";

const action = (overrides = {}) => ({
  visible: true,
  labelVisible: true,
  mode: "icon-text",
  label: "存档",
  buttonWidth: 76,
  buttonHeight: 40,
  color: "rgba(0, 0, 0, 0.898)",
  backgroundColor: "rgba(0, 0, 0, 0)",
  border: "0px none rgba(0, 0, 0, 0.898)",
  borderRadius: "8px",
  padding: "0px 8px",
  gap: "8px",
  ...overrides,
});

const snapshot = {
  schemaVersion: 2,
  source: "html-live-computed-style",
  htmlSourceFingerprint: "current-html",
  viewport: { width: 1728, height: 1152 },
  regions: { detailTitlebarActions: { order: ["archive"], actions: { archive: action() } } },
};

assert.deepEqual(validateFreshHtmlVisualSnapshot({
  snapshot,
  htmlSourceFingerprint: "current-html",
  viewport: { width: 1728, height: 1152 },
  requiredActions: ["archive"],
}), {
  ok: true,
  schemaVersion: 2,
  source: "html-live-computed-style",
  htmlSourceFingerprint: "current-html",
});

assert.throws(() => validateFreshHtmlVisualSnapshot({
  snapshot: { ...snapshot, htmlSourceFingerprint: "old-html" },
  htmlSourceFingerprint: "current-html",
  viewport: { width: 1728, height: 1152 },
  requiredActions: ["archive"],
}), /does not match current HTML/);

assert.throws(() => validateFreshHtmlVisualSnapshot({
  snapshot: { ...snapshot, source: "html-computed-style" },
  htmlSourceFingerprint: "current-html",
  viewport: { width: 1728, height: 1152 },
  requiredActions: ["archive"],
}), /source must be html-live-computed-style/);

assert.throws(() => validateFreshHtmlVisualSnapshot({
  snapshot: { ...snapshot, regions: { detailTitlebarActions: { actions: { archive: action({ color: undefined }) } } } },
  htmlSourceFingerprint: "current-html",
  viewport: { width: 1728, height: 1152 },
  requiredActions: ["archive"],
}), /order is missing/);

assert.throws(() => validateFreshHtmlVisualSnapshot({
  snapshot: { ...snapshot, regions: { detailTitlebarActions: { order: ["archive"], actions: { archive: action({ color: undefined }) } } } },
  htmlSourceFingerprint: "current-html",
  viewport: { width: 1728, height: 1152 },
  requiredActions: ["archive"],
}), /no computed color/);

const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-html-fingerprint-"));
try {
  fs.writeFileSync(path.join(sourceRoot, "index.html"), "<!doctype html><main>Stable source</main>\n");
  const before = computeHtmlSourceFingerprint(sourceRoot);
  fs.mkdirSync(path.join(sourceRoot, ".text-to-ui", "pixso-runs", "run-1"), { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, ".text-to-ui", "pixso-runs", "run-1", "pixso-operation-plan.json"), "{}\n");
  fs.mkdirSync(path.join(sourceRoot, "pixso-runs", "run-2"), { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, "pixso-runs", "run-2", "html-reference.png"), "generated\n");
  assert.equal(computeHtmlSourceFingerprint(sourceRoot), before, "generated run evidence must not change the HTML source fingerprint");
} finally {
  fs.rmSync(sourceRoot, { recursive: true, force: true });
}

console.log("HTML visual contract tests passed: stale snapshots are blocked and generated run evidence is fingerprint-isolated.");
