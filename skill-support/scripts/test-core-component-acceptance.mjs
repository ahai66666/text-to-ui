#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";

const script = path.resolve("skill-support/scripts/build-component-acceptance-report.mjs");
const run = (...args) => spawnSync(process.execPath, [script, "--repo", process.cwd(), ...args], { encoding: "utf8" });
const result = run();
assert.equal(result.status, 0, result.stderr);
const report = JSON.parse(result.stdout);
assert.equal(report.components.length, 8);
assert.deepEqual(report.summary, { approved: 0, provisional: 8, blocked: 0, foundationReady: 8 });
for (const component of report.components) {
  assert.equal(component.automatedFoundationReady, true, component.logicalName);
  assert.deepEqual(component.readiness.unresolvedDimensions, ["visualParity", "behaviorParity", "accessibilityParity"]);
}
assert.notEqual(run("--strict-release").status, 0, "provisional core components must not pass release acceptance");
console.log("Core component acceptance foundation passed for 8 components.");
