#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveComponentBindings, resolveComponentVariant } from "./component-mapping-resolver.mjs";
import {
  DEFAULT_MAPPING_REGISTRY,
  componentFactsNames,
  SKILL_ROOT,
  readMappingRegistry,
  runtimeSemanticMappingsForProfile,
  selectMappingProfile,
} from "./mapping-registry-lib.mjs";
import { loadComponentMap, loadTokenResources, readJson } from "./pixso-native-scene-lib.mjs";

const { value: registry } = readMappingRegistry(DEFAULT_MAPPING_REGISTRY);
const profile = selectMappingProfile(registry);
const runtimeMap = readJson(path.join(SKILL_ROOT, "assets/design-system/token-runtime-map.json"));
const nativeComponentMap = readJson(path.join(SKILL_ROOT, "assets/design-system/pixso-native-component-map.json"));
const componentFacts = readJson(path.join(SKILL_ROOT, "assets/design-system/pixso-component-facts.json"));
const componentIndex = readJson(path.join(SKILL_ROOT, "references/index/generated/component-index.json"));

assert.equal(profile.id, registry.defaultProfile);
assert.equal(profile.tokenMappings.length, profile.summary.canonicalTokenMappings);
assert.equal(profile.semanticTokenMappings.length, 290);
assert.equal(profile.runtimeSemanticAliases.length, 25);
assert.equal(Object.hasOwn(profile, "runtimeSemanticMappings"), false);
assert.equal(runtimeSemanticMappingsForProfile(profile).length, Object.keys(runtimeMap.semanticRoles).length);
assert.equal(profile.componentMappings.length, componentIndex.componentCount);
assert.deepEqual(
  profile.componentMappings.map((mapping) => mapping.htmlLogicalName).sort(),
  componentIndex.components.map((component) => component.logicalName).sort(),
  "central component mappings must cover exactly the current HTML component index",
);
assert.equal(profile.summary.registeredPixsoTargets, componentFactsNames(componentFacts).size);
assert.equal(profile.summary.htmlToPixsoExactMatches, 25);
assert.equal(nativeComponentMap.projectionKind, "generated-compatibility-projection");
assert.equal(nativeComponentMap.generatedFrom, "mapping-registry.json");
assert.equal(nativeComponentMap.readOnly, true);
assert.equal(nativeComponentMap.mappings.find((mapping) => mapping.logicalName === "Icon Text Button/Primary/Default")?.iconColorSource, "variant-content");

const tokens = loadTokenResources();
assert.equal(tokens.mappingProfile.id, profile.id);
for (const name of ["brand/100", "color/text", "content/primary", "layout/sidebar-width"]) {
  assert.ok(tokens.resolve(name).name, `Token alias did not resolve: ${name}`);
}

const centralMap = loadComponentMap(DEFAULT_MAPPING_REGISTRY);
assert.equal(centralMap.mappingProfile.id, profile.id);
assert.equal(centralMap.map.get("Button/Primary/Default")?.pixsoName, "Button");
assert.equal(centralMap.map.get("Checkbox/Default")?.pixsoName, "CheckBox");
assert.equal(centralMap.map.get("Radio/Unselected/Default")?.pixsoName, "Radio");
assert.equal(centralMap.map.get("Switch/Default")?.pixsoName, "Switch");
assert.equal(centralMap.map.get("Dialog/Default")?.pixsoName, "Dialog-2in1");
assert.equal(
  profile.endpointComponentMappings.find((mapping) => mapping.endpointComponentId === "split-dropdown")?.pixsoTarget,
  "split-dropdown",
);
assert.equal(
  profile.endpointComponentMappings.find((mapping) => mapping.endpointComponentId === "split-dropdown-icon")?.pixsoTarget,
  "split-dropdown",
);
assert.deepEqual(centralMap.map.get("Checkbox/Default")?.variant, { checked: "false", state: "Default" });
assert.deepEqual(centralMap.map.get("Switch/Default")?.variant, { checked: "false", state: "Default" });
assert.equal(
  profile.componentMappings.find((mapping) => mapping.htmlLogicalName === "Switch/Default")?.pixsoSpecKey,
  "Switch/Off/Default",
);
assert.deepEqual(
  profile.nativeSourceMappings.find((mapping) => mapping.source?.componentSet === "Radio")?.source?.variant,
  { checked: "false", state: "Default" },
);
assert.deepEqual(
  nativeComponentMap.mappings.find((mapping) => mapping.logicalName === "Checkbox/Unchecked/Default")?.variant,
  { checked: "false", state: "Default" },
);
assert.equal(centralMap.map.get("Sidebar Item/Default")?.pixsoName, "Sidebar Item");
assert.equal(centralMap.map.get("Sub Tabs/Default")?.pixsoName, "Sub Tabs Item");
assert.deepEqual(centralMap.map.get("Sub Tabs/Default")?.variant, { state: "Unselected" });
assert.equal(centralMap.map.get("Snackbar/Default")?.pixsoName, "Snackbar");
assert.equal(centralMap.map.get("Chips/Default")?.pixsoName, "Chips");
assert.deepEqual(centralMap.map.get("Chips/Default")?.variant, { "状态": "Default" });
assert.deepEqual(centralMap.map.get("Snackbar/Default")?.variant, { "左侧区域": "1" });
assert.equal(centralMap.map.get("Alert/Default")?.pixsoName, "Alert");
assert.deepEqual(centralMap.map.get("Alert/Default")?.variantByHtml?.danger, { "属性 1": "Error" });
assert.equal(centralMap.map.get("Badge/Default")?.pixsoName, "Badge");
assert.deepEqual(centralMap.map.get("Badge/Default")?.variantByHtml?.danger, { "属性 1": "Error" });
assert.equal(centralMap.map.get("Accordion/Default")?.pixsoName, "Accordion");
assert.equal(centralMap.map.get("Breadcrumb/Default")?.pixsoName, "Breadcrumb");
assert.equal(centralMap.map.get("Collapsible/Default")?.pixsoName, "Collapsible");
assert.equal(centralMap.map.get("Menubar/Default")?.pixsoName, "Menubar");
assert.equal(centralMap.map.get("Pagination/Default")?.pixsoName, "Pagination/Default");
assert.equal(centralMap.map.get("Context Menu/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Context Menu/Default")?.pixsoName, null);
assert.equal(centralMap.map.get("Dropdown Menu/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Field/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Form Field/Default")?.pixsoName, "Form Field");
assert.deepEqual(resolveComponentVariant(centralMap.map.get("Form Field/Default"), {
  props: { surface: "gray", state: "error" },
}), { surface: "Gray", state: "Error" });
assert.equal(centralMap.map.get("Label/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Combobox/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Tooltip/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Popover/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Hover Card/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Avatar/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Table/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("Number Selector/Default")?.pixsoName, "Number Selector/Default");
assert.equal(centralMap.map.get("Progress/Default")?.pixsoName, "Progress/Default");
assert.equal(centralMap.map.get("Selection Dropdown/Default")?.pixsoName, "Selection Dropdown");
assert.equal(centralMap.map.get("List Item/White Surface/Default")?.availability, "excluded");
assert.equal(centralMap.map.get("List Item/White Surface/Default")?.pixsoName, null);

// No generated compatibility file may influence canonical resolution.
const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-mapping-test-"));
try {
  const registryFile = path.join(isolated, "mapping-registry.json");
  fs.writeFileSync(registryFile, JSON.stringify(registry));
  assert.deepEqual(loadComponentMap(registryFile).mappings, centralMap.mappings);
  fs.writeFileSync(path.join(isolated, "pixso-native-component-map.json"), "invalid stale projection");
  assert.deepEqual(loadComponentMap(registryFile).mappings, centralMap.mappings);
} finally {
  fs.rmSync(isolated, { recursive: true, force: true });
}
assert.throws(() => resolveComponentBindings({
  componentMappings: [{ htmlLogicalName: "Button" }], componentAliases: [{ logicalName: "Button" }],
}), /Duplicate or invalid component alias/);
assert.throws(() => resolveComponentBindings({
  componentAliases: [{ logicalName: "Alias" }, { logicalName: "Alias" }],
}), /Duplicate or invalid component alias/);
assert.equal(resolveComponentBindings({
  componentMappings: [{ htmlLogicalName: "Removed", pixsoTargetStatus: "unregistered" }],
  nativeSourceMappings: [{ target: "Removed", source: { componentSet: "OldTarget" } }],
}).map.get("Removed").pixsoName, null, "source facts cannot revive an unregistered mapping");
const pendingReviewBinding = resolveComponentBindings({
  componentMappings: [{
    htmlLogicalName: "Pending", pixsoTarget: "Missing", pixsoTargetStatus: "pending-review",
    pixsoMappingReason: "fixture", runtimeBinding: { pixsoName: "Missing", componentSetName: "Missing", availability: "mapped" },
  }],
  nativeSourceMappings: [{ target: "Pending", source: { componentSet: "Missing" } }],
}).map.get("Pending");
assert.equal(pendingReviewBinding.availability, "pending-review");
assert.equal(pendingReviewBinding.pixsoName, null, "pending-review must compose natively instead of creating a stale instance");

console.log(
  `Mapping registry integration valid: ${profile.tokenMappings.length} canonical Tokens, ` +
    `${runtimeSemanticMappingsForProfile(profile).length} runtime roles, ${profile.componentMappings.length} HTML Components.`,
);
