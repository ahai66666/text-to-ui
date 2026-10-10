#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  componentFactsEntries,
  readMappingRegistry,
  registryTargetLibrary,
  resolveRegistryPath,
  selectMappingProfile,
} from "./mapping-registry-lib.mjs";
import { loadTokenResources } from "./pixso-native-scene-lib.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(skillRoot, "..");
const registryFile = path.join(skillRoot, "assets/design-system/mapping-registry.json");
const contracts = JSON.parse(fs.readFileSync(path.join(repoRoot, "packages/component-contracts/src/components.json"), "utf8"));
const specs = JSON.parse(fs.readFileSync(path.join(skillRoot, "assets/design-system/pixso-component-specs.json"), "utf8"));
const { value: registry } = readMappingRegistry(registryFile);
const profile = selectMappingProfile(registry);
const targetLibrary = registryTargetLibrary(registry, profile);
const facts = JSON.parse(fs.readFileSync(resolveRegistryPath(registryFile, targetLibrary.facts), "utf8"));
const factsByName = new Map(componentFactsEntries(facts).map((item) => [item.name, item]));
const contractByName = new Map(contracts.components.map((item) => [item.logicalName, item]));
const tokens = loadTokenResources();
const failures = [];

const sameValue = (left, right) => String(left).toLowerCase() === String(right).toLowerCase();
const tokenNumber = (name) => {
  if (!name) return null;
  try {
    const value = Number(tokens.resolve(name).value);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};
const validatePixsoVariant = (label, target, variant) => {
  if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
    failures.push(`${label}: variant must be an object`);
    return;
  }
  for (const [axis, value] of Object.entries(variant)) {
    const values = target?.variantAxes?.[axis] ?? [];
    if (!values.some((candidate) => sameValue(candidate, value))) {
      failures.push(`${label}: Pixso target does not expose ${axis}=${value}`);
    }
  }
};

const mappingNames = new Set(profile.componentMappings.map((item) => item.htmlLogicalName));
for (const contract of contracts.components) {
  if (!mappingNames.has(contract.logicalName)) failures.push(`Missing mapping row: ${contract.logicalName}`);
}
for (const mapping of profile.componentMappings) {
  const contract = contractByName.get(mapping.htmlLogicalName);
  if (!contract) failures.push(`Mapping outside framework contract: ${mapping.htmlLogicalName}`);
  if (mapping.pixsoTargetStatus !== "registered") continue;
  const runtime = mapping.runtimeBinding ?? {};
  const targetName = runtime.componentSetName ?? runtime.pixsoName ?? mapping.pixsoTarget;
  const target = factsByName.get(targetName);
  if (!target) failures.push(`${mapping.htmlLogicalName}: missing current Pixso fact ${targetName}`);
  if (runtime.pixsoName !== mapping.pixsoTarget || runtime.componentSetName !== mapping.pixsoTarget) {
    failures.push(`${mapping.htmlLogicalName}: runtime identity must equal registered target ${mapping.pixsoTarget}`);
  }
  validatePixsoVariant(`${mapping.htmlLogicalName}.variant`, target, runtime.variant ?? {});
  const ignoredFrameworkProps = new Set(runtime.ignoredFrameworkProps ?? []);
  for (const prop of contract?.props ?? []) {
    if (ignoredFrameworkProps.has(prop)) continue;
    if (!(runtime.supportedProps ?? []).includes(prop)) {
      failures.push(`${mapping.htmlLogicalName}: mapped runtime drops framework prop ${prop}`);
    }
  }
  for (const slot of contract?.slots ?? []) {
    if (!(runtime.supportedSlots ?? []).includes(slot)) {
      failures.push(`${mapping.htmlLogicalName}: mapped runtime drops framework slot ${slot}`);
    }
  }
  for (const [htmlVariant, pixsoVariant] of Object.entries(runtime.variantByHtml ?? {})) {
    if (contract && !contract.variants.includes(htmlVariant)) {
      failures.push(`${mapping.htmlLogicalName}: variantByHtml contains non-contract variant ${htmlVariant}`);
    }
    validatePixsoVariant(`${mapping.htmlLogicalName}.variantByHtml.${htmlVariant}`, target, pixsoVariant);
  }
  for (const [propName, propVariants] of Object.entries(runtime.variantByProp ?? {})) {
    if (contract && !contract.props.includes(propName)) {
      failures.push(`${mapping.htmlLogicalName}: variantByProp contains non-contract prop ${propName}`);
    }
    for (const [propValue, pixsoVariant] of Object.entries(propVariants ?? {})) {
      validatePixsoVariant(`${mapping.htmlLogicalName}.variantByProp.${propName}.${propValue}`, target, pixsoVariant);
    }
  }
  if (runtime.variantTargetByHtml) {
    failures.push(`${mapping.htmlLogicalName}: legacy variantTargetByHtml is forbidden; map framework variants onto one Pixso component set`);
  }
  const componentSpec = specs.components?.[mapping.pixsoSpecKey];
  if (!componentSpec) failures.push(`${mapping.htmlLogicalName}: missing Pixso spec ${mapping.pixsoSpecKey}`);
  else if (!String(componentSpec.previewSelector ?? "").includes(".tui-")) {
    failures.push(`${mapping.htmlLogicalName}: previewSelector must select the framework component, got ${componentSpec.previewSelector}`);
  }
  const selectedFact = (target?.variants ?? []).find((candidate) =>
    Object.entries(runtime.variant ?? {}).every(([axis, value]) => sameValue(candidate.variantProperties?.[axis], value))
  );
  const expectedHeight = Number(componentSpec?.sizing?.height);
  const actualHeight = Number(selectedFact?.geometry?.height);
  const expectedRadius = tokenNumber(componentSpec?.radiusToken);
  const actualRadius = Number(selectedFact?.geometry?.cornerRadius);
  const geometryIssues = [];
  if (Number.isFinite(expectedHeight) && Number.isFinite(actualHeight) && Math.abs(expectedHeight - actualHeight) > 0.55) {
    geometryIssues.push(`height ${actualHeight}/${expectedHeight}`);
  }
  if (expectedRadius !== null && Number.isFinite(actualRadius) && Math.abs(expectedRadius - actualRadius) > 0.55) {
    geometryIssues.push(`radius ${actualRadius}/${expectedRadius}`);
  }
  if (geometryIssues.length && mapping.nativeSourceStatus !== "mapped-needs-rebuild") {
    failures.push(`${mapping.htmlLogicalName}: Pixso geometry differs from framework spec (${geometryIssues.join(", ")}); mark mapped-needs-rebuild or repair Pixso`);
  }
}

const reactBadge = fs.readFileSync(path.join(repoRoot, "packages/components-react/src/index.jsx"), "utf8");
const vueBadge = fs.readFileSync(path.join(repoRoot, "packages/components-vue/src/Badge.vue"), "utf8");
if (!reactBadge.includes('contract("badge", "Badge/Default", safeTone,')) {
  failures.push("React Badge must keep Badge/Default identity and expose tone through data-variant");
}
if (!vueBadge.includes(':data-variant="[\'info\', \'success\', \'warning\', \'danger\', \'neutral\'].includes(props.tone) ? props.tone : \'info\'"')) {
  failures.push("Vue Badge must expose the resolved tone through data-variant");
}

if (failures.length) {
  console.error(["Framework/Pixso parity validation failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exit(1);
}

console.log(`Framework/Pixso parity valid: ${contracts.components.length} framework contracts, ${profile.componentMappings.filter((item) => item.pixsoTargetStatus === "registered").length} registered Pixso mappings.`);
