#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { contractInspectorData } from "../apps/component-gallery/contract-inspector.js";
import { coreAcceptanceLogicalNames, readinessInfoFor, readinessSummary, runtimeComponents } from "../apps/component-gallery/runtime-catalog.js";

assert.deepEqual(readinessSummary, { approved: 0, provisional: 49, blocked: 0 });
assert.equal(coreAcceptanceLogicalNames.size, 8);
for (const component of runtimeComponents) {
  const readiness = readinessInfoFor(component);
  assert.equal(readiness.level, "provisional", component.logicalName);
  assert.deepEqual(readiness.unresolvedDimensions, ["visualParity", "behaviorParity", "accessibilityParity"]);
}
const button = runtimeComponents.find((component) => component.id === "button");
const inspector = contractInspectorData(button, "html");
assert.equal(inspector.statusLabel, "Provisional");
assert.deepEqual(inspector.unresolvedLabels, ["视觉", "行为", "可访问性"]);
const gallery = fs.readFileSync(new URL("../apps/component-gallery/index.html", import.meta.url), "utf8");
assert.doesNotMatch(gallery, /legacy-skill|data-legacy-path|framework-component-contract|component-gallery\.html/);
assert.doesNotMatch(gallery, /\b(?:51|52) 项目录/);
console.log("Gallery readiness projection valid: 0 Approved, 49 Provisional, 0 Blocked; 8 first-batch components.");
