#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createComponentFactsSyncProposal,
  normalizeFacts,
  syncPixsoComponentFacts,
} from "./pixso-component-facts-sync.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(scriptDirectory, "..");

const variantProperties = {
  size: "Medium",
  state: "Default",
  type: "primary",
};
const geometry = {
  width: 108,
  height: 40,
  itemSpacing: 8,
  padding: { top: 4, right: 8, bottom: 4, left: 8 },
  layoutMode: "HORIZONTAL",
};

const incomingFacts = {
  $schema: "./pixso-component-facts.schema.json",
  schemaVersion: 1,
  kind: "text-to-ui.pixso-component-facts",
  document: "鸿蒙客户端设计规范",
  page: "NewComponents",
  source: "fixture",
  capturedAt: "2026-09-02T00:00:00.000Z",
  scope: "main-component-inventory-with-geometry",
  policy: { captureTraversal: "page-descendant-top-level" },
  componentSets: [
    {
      name: "icon-text",
      classification: "business",
      variantAxes: {
        size: ["Medium"],
        state: ["Default"],
        type: ["primary"],
        density: ["Default"],
      },
      variants: [
        {
          name: "type=primary, size=Medium, state=Default, density=Default",
          variantProperties,
          geometry,
        },
      ],
    },
  ],
  standaloneComponents: [],
};

const currentFacts = {
  ...incomingFacts,
  capturedAt: "2026-09-01T00:00:00.000Z",
  componentSets: [{
    name: "icon-text",
    classification: "business",
    variantAxes: {
      size: ["Medium"],
      state: ["Default"],
      type: ["primary"],
    },
  }],
};

const incomingFactsWith23Targets = {
  ...incomingFacts,
  componentSets: [
    ...incomingFacts.componentSets,
    ...Array.from({ length: 22 }, (_, index) => ({
      name: `zz-extra-target-${String(index + 1).padStart(2, "0")}`,
      classification: "business",
    })),
  ],
};

const registry = {
  schemaVersion: 1,
  kind: "text-to-ui.mapping-registry",
  defaultProfile: "fixture-profile",
  profiles: [{
    id: "fixture-profile",
    summary: { registeredPixsoTargets: 1 },
    componentMappings: [{
      htmlLogicalName: "Fixture/Default",
      pixsoTarget: "missing-fixture",
      pixsoTargetStatus: "registered",
      pixsoSpecKey: "Fixture/Default",
      nativeSourceStatus: "verified",
      runtimeBinding: { rendererKey: "fixture", pixsoName: "missing-fixture", componentSetName: "missing-fixture", availability: "mapped" },
    }],
    endpointComponentMappings: [{
      endpointComponentId: "icon-text-primary",
      htmlLogicalName: "Icon Text Button/Primary/Default",
      pixsoTarget: "icon-text",
      pixsoTargetStatus: "registered",
      pixsoVariant: { size: "Medium", state: "Default", type: "primary", density: "Default" },
      mappingStatus: "mapped-pending-verification",
    }],
    nativeSourceMappings: [{
      source: {
        componentSet: "icon-text",
        variant: { size: "Medium", state: "Default", type: "Primary" },
      },
      pixsoVariant: { size: "Medium", state: "Default", type: "primary" },
      target: "Icon Text Button/Primary/Default",
      targetHtmlLogicalName: "Icon Text Button/Primary/Default",
      tokens: { height: "size/40", gap: "space/5", paddingX: "space/5" },
    }, {
      source: {
        componentSet: "legacy-missing-component",
        variant: { size: "Medium", state: "Default" },
      },
      pixsoVariant: { size: "Medium", state: "Default" },
      target: "Legacy Missing/Default",
      targetHtmlLogicalName: "Legacy Missing/Default",
      tokens: { height: "size/40" },
    }],
  }],
};

const normalized = normalizeFacts(incomingFacts);
assert.equal(normalized.componentSets[0].variants[0].name, "size=Medium, state=Default, type=primary");
assert.deepEqual(normalized.componentSets[0].variants[0].variantProperties, variantProperties);
assert.equal(JSON.stringify(normalized).includes("density"), false);

const proposal = createComponentFactsSyncProposal({
  incomingFacts,
  currentFacts,
  registry,
  root: sourceRoot,
});
assert.equal(proposal.status, "changes-pending");
assert.equal(proposal.blockingChangeCount, 0);
assert.equal(proposal.factsWriteAllowed, true);
assert.equal(proposal.hasSafeWork, true);
assert.ok(proposal.operations.some((item) => item.collection === "componentMappings" && item.path === "pixsoTargetStatus" && item.value === "pending-review"));
assert.ok(proposal.changes.some((item) => item.kind === "remove-unsupported-variant-axis"));
assert.ok(proposal.operations.some((item) => item.path === "tokens.paddingX" && item.value === "space/3"));
assert.equal(
  proposal.operations.some((item) => item.path === "source.variant"),
  false,
  "explicit pixsoVariant must keep the native source variant taxonomy unchanged",
);

const asymmetricFacts = JSON.parse(JSON.stringify(incomingFacts));
asymmetricFacts.componentSets[0].variants[0].geometry.padding = {
  top: 4,
  right: 4,
  bottom: 4,
  left: 12,
};
const asymmetricRegistry = JSON.parse(JSON.stringify(registry));
asymmetricRegistry.profiles[0].nativeSourceMappings[0].tokens = {
  height: "size/40",
  gap: "space/5",
  paddingLeft: "space/5",
  paddingRight: "space/4",
};
const asymmetricProposal = createComponentFactsSyncProposal({
  incomingFacts: asymmetricFacts,
  currentFacts,
  registry: asymmetricRegistry,
  root: sourceRoot,
});
assert.equal(asymmetricProposal.changes.some((item) => item.kind === "asymmetric-geometry"), false);
assert.ok(asymmetricProposal.operations.some((item) => item.path === "tokens.paddingLeft" && item.value === "space/4"));
assert.ok(asymmetricProposal.operations.some((item) => item.path === "tokens.paddingRight" && item.value === "space/2"));
assert.equal(asymmetricProposal.changes.some((item) => String(item.path).includes("[object Object]")), false);

const timestampOnly = createComponentFactsSyncProposal({
  incomingFacts,
  currentFacts: { ...incomingFacts, capturedAt: "2026-09-03T00:00:00.000Z" },
  registry,
  root: sourceRoot,
});
assert.equal(timestampOnly.factsChanged, false);

const incompleteInventory = createComponentFactsSyncProposal({
  incomingFacts: { ...incomingFacts, policy: {} },
  currentFacts,
  registry,
  root: sourceRoot,
});
assert.equal(incompleteInventory.completeInventory, false);
assert.equal(incompleteInventory.factsWriteAllowed, false);
assert.ok(incompleteInventory.changes.some((item) => item.kind === "incomplete-component-inventory"));
assert.equal(incompleteInventory.changes.some((item) => item.kind === "component-removed"), false);
assert.equal(incompleteInventory.changes.some((item) => item.kind === "target-component-missing"), false);

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-component-sync-"));
const fixtureDesignSystem = path.join(fixtureRoot, "assets/design-system");
fs.mkdirSync(fixtureDesignSystem, { recursive: true });
for (const file of ["tokens.spacing.json", "tokens.size.json", "tokens.radius.json"]) {
  fs.copyFileSync(path.join(sourceRoot, "assets/design-system", file), path.join(fixtureDesignSystem, file));
}
fs.writeFileSync(path.join(fixtureDesignSystem, "pixso-component-facts.json"), `${JSON.stringify(currentFacts, null, 2)}\n`);
fs.writeFileSync(path.join(fixtureDesignSystem, "mapping-registry.json"), `${JSON.stringify(registry, null, 2)}\n`);

const applied = syncPixsoComponentFacts({
  root: fixtureRoot,
  stateDirectory: path.join(fixtureRoot, "state"),
  incomingFacts: incomingFactsWith23Targets,
  mode: "apply-safe",
  runDerived: false,
});
assert.equal(applied.ok, true);
assert.equal(applied.applied, true);
assert.equal(applied.appliedFacts, true);
assert.equal(applied.proposal.blockingChangeCount, 0);
assert.equal(applied.pendingBlockingCount, 0);
const writtenFacts = JSON.parse(fs.readFileSync(path.join(fixtureDesignSystem, "pixso-component-facts.json"), "utf8"));
const writtenRegistry = JSON.parse(fs.readFileSync(path.join(fixtureDesignSystem, "mapping-registry.json"), "utf8"));
assert.equal(writtenFacts.componentSets.find((item) => item.name === "icon-text").variants[0].name.includes("density"), false);
assert.equal(writtenRegistry.profiles[0].summary.registeredPixsoTargets, 23);
assert.deepEqual(writtenRegistry.profiles[0].endpointComponentMappings[0].pixsoVariant, variantProperties);
assert.equal(writtenRegistry.profiles[0].nativeSourceMappings[0].source.variant.type, "Primary");
assert.equal(writtenRegistry.profiles[0].nativeSourceMappings[0].tokens.paddingX, "space/3");
assert.equal(writtenRegistry.profiles[0].nativeSourceMappings[0].tokens.gap, "space/3");
assert.equal(writtenRegistry.profiles[0].componentMappings[0].pixsoTargetStatus, "pending-review");
assert.ok(fs.existsSync(path.join(fixtureRoot, "state/component-sync/latest-proposal.json")));

const blockedRegistry = JSON.parse(JSON.stringify(registry));
blockedRegistry.profiles[0].endpointComponentMappings[0].pixsoTarget = "missing-icon-text";
blockedRegistry.profiles[0].nativeSourceMappings = blockedRegistry.profiles[0].nativeSourceMappings
  .map((mapping) => mapping.targetHtmlLogicalName === "Icon Text Button/Primary/Default"
    ? { ...mapping, source: { ...mapping.source, variant: variantProperties }, tokens: { height: "size/40", gap: "space/3", paddingX: "space/3" } }
    : mapping);
const blocked = createComponentFactsSyncProposal({
  incomingFacts,
  currentFacts,
  registry: blockedRegistry,
  root: sourceRoot,
});
assert.equal(blocked.status, "changes-pending");
assert.equal(blocked.blockingChangeCount, 0);
assert.equal(blocked.factsWriteAllowed, true);
assert.equal(blocked.hasSafeWork, true);

const partialRegistry = JSON.parse(JSON.stringify(registry));
partialRegistry.profiles[0].endpointComponentMappings[0].pixsoTarget = "missing-icon-text";
const partialRoot = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-component-sync-partial-"));
const partialDesignSystem = path.join(partialRoot, "assets/design-system");
fs.mkdirSync(partialDesignSystem, { recursive: true });
for (const file of ["tokens.spacing.json", "tokens.size.json", "tokens.radius.json"]) {
  fs.copyFileSync(path.join(sourceRoot, "assets/design-system", file), path.join(partialDesignSystem, file));
}
fs.writeFileSync(path.join(partialDesignSystem, "pixso-component-facts.json"), `${JSON.stringify(currentFacts, null, 2)}\n`);
fs.writeFileSync(path.join(partialDesignSystem, "mapping-registry.json"), `${JSON.stringify(partialRegistry, null, 2)}\n`);
const partialApplied = syncPixsoComponentFacts({
  root: partialRoot,
  stateDirectory: path.join(partialRoot, "state"),
  incomingFacts,
  mode: "apply-safe",
  runDerived: false,
});
assert.equal(partialApplied.ok, true);
assert.equal(partialApplied.applied, true);
assert.equal(partialApplied.appliedFacts, true);
assert.equal(partialApplied.pendingBlockingCount, 0);
const refreshedFacts = JSON.parse(fs.readFileSync(path.join(partialDesignSystem, "pixso-component-facts.json"), "utf8"));
assert.ok(Array.isArray(refreshedFacts.componentSets[0].variants));
const partialWrittenRegistry = JSON.parse(fs.readFileSync(path.join(partialDesignSystem, "mapping-registry.json"), "utf8"));
assert.equal(partialWrittenRegistry.profiles[0].nativeSourceMappings[0].source.variant.type, "Primary");
fs.rmSync(partialRoot, { recursive: true, force: true });

const manifest = JSON.parse(fs.readFileSync(path.join(scriptDirectory, "pixso-component-registry-sync-plugin/manifest.json"), "utf8"));
assert.equal(manifest.ui, "./ui.html");
assert.ok(manifest.menu.some((item) => item.command === "sync"));
const pluginSource = fs.readFileSync(path.join(scriptDirectory, "pixso-component-registry-sync-plugin/main.js"), "utf8");
assert.match(pluginSource, /variantProperties/);
assert.match(pluginSource, /readComponentFacts/);
assert.match(pluginSource, /page-descendant-top-level/);
assert.match(pluginSource, /pixso\.ui\.postMessage/);
assert.match(pluginSource, /componentSet: "icon-text"/);
assert.match(fs.readFileSync(path.join(scriptDirectory, "pixso-component-registry-sync-plugin/ui.html"), "utf8"), /\/component-sync/);
assert.match(fs.readFileSync(path.join(scriptDirectory, "pixso-plugin-bridge.mjs"), "utf8"), /syncPixsoComponentFacts/);
const generatedSpecs = JSON.parse(fs.readFileSync(path.join(sourceRoot, "assets/design-system/pixso-component-specs.json"), "utf8"));
for (const name of [
  "Icon Text Button/Primary/Default",
  "Icon Text Button/Secondary/Default",
  "Icon Text Button/Ghost/Default",
]) assert.equal(generatedSpecs.components[name].paddingXToken, "padding/button-sm-x");

const currentFactsSnapshot = JSON.parse(fs.readFileSync(path.join(sourceRoot, "assets/design-system/pixso-component-facts.json"), "utf8"));
const splitFacts = currentFactsSnapshot.componentSets.find((item) => item.name === "split-dropdown");
assert.equal(splitFacts.variantAxes.density, undefined);
const currentRegistrySnapshot = JSON.parse(fs.readFileSync(path.join(sourceRoot, "assets/design-system/mapping-registry.json"), "utf8"));
const currentProfile = currentRegistrySnapshot.profiles.find((item) => item.id === currentRegistrySnapshot.defaultProfile) ?? currentRegistrySnapshot.profiles[0];
for (const endpointId of ["split-dropdown", "split-dropdown-icon"]) {
  assert.equal(currentProfile.endpointComponentMappings.find((item) => item.endpointComponentId === endpointId).pixsoVariant.density, undefined);
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });
console.log("Pixso component facts sync test passed: variantProperties, density cleanup, geometry tokens, safe apply, and plugin wiring are covered.");
