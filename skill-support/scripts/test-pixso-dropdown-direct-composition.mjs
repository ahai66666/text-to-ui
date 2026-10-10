#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const designSystem = path.join(skillRoot, "assets/design-system");
const generator = path.join(skillRoot, "scripts/generate-pixso-component-library-plan.mjs");
const mappingRegistry = JSON.parse(fs.readFileSync(path.join(designSystem, "mapping-registry.json"), "utf8"));
const profile = mappingRegistry.profiles.find((item) => item.id === mappingRegistry.defaultProfile);
const dropdownMapping = profile.componentMappings.find((item) => item.htmlLogicalName === "Dropdown Menu/Default");

assert.equal(dropdownMapping?.pixsoTargetStatus, "unregistered");
assert.equal(dropdownMapping?.pixsoMappingPolicy, "excluded");
assert.equal(dropdownMapping?.pixsoTarget, null);
assert.match(dropdownMapping?.pixsoMappingReason ?? "", /直接组合普通节点/);

const specs = JSON.parse(fs.readFileSync(path.join(designSystem, "pixso-component-specs.json"), "utf8")).components;
assert.equal(specs["Input/Tag Entry/Default"]?.slotContracts?.suggestions?.compositionStrategy, "direct-native-nodes");
assert.equal(specs["Input/Tag Entry/Default"]?.slotContracts?.suggestions?.panelStyle, undefined);
assert.equal(specs["Search/Scoped/Default"]?.slotContracts?.["scope-selector"]?.compositionStrategy, "direct-native-nodes");
assert.equal(specs["Dropdown Menu/Default"]?.pixsoReusableTarget, false);

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-dropdown-exclusion-"));
try {
  const rejectedPlanPath = path.join(temporaryRoot, "dropdown.json");
  const rejected = spawnSync(process.execPath, [
    generator,
    "--out", rejectedPlanPath,
    "--logical-name", "Dropdown Menu/Default",
  ], { cwd: skillRoot, encoding: "utf8" });
  assert.notEqual(rejected.status, 0, "an explicitly requested Dropdown Menu master must be rejected");
  assert.match(rejected.stderr, /compose directly from Token-bound native nodes/);
  assert.equal(fs.existsSync(rejectedPlanPath), false);

  const directPlanPath = path.join(temporaryRoot, "direct-composition.json");
  const direct = spawnSync(process.execPath, [
    generator,
    "--out", directPlanPath,
    "--logical-name", "Input/Tag Entry/Default,Search/Scoped/Default",
  ], { cwd: skillRoot, encoding: "utf8" });
  assert.equal(direct.status, 0, direct.stderr || direct.stdout);
  const plan = JSON.parse(fs.readFileSync(directPlanPath, "utf8"));
  const operations = JSON.stringify(plan.operations);
  assert.equal(operations.includes("Dropdown Menu/Default"), false);
  assert.equal(plan.operations.some((operation) => operation.op === "create-component" && operation.name === "Dropdown Menu/Default"), false);
  assert.ok(plan.summary.excludedComponents.includes("Dropdown Menu/Default"));
  assert.ok(plan.operations.some((operation) => operation.metadata?.compositionStrategy === "direct-native-nodes"));
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log("Pixso Dropdown exclusion test passed: imports are blocked; Input and Search use direct native-node composition.");
