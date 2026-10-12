#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMappingRegistry, selectMappingProfile, registryTargetLibrary } from "../skill-support/scripts/mapping-registry-lib.mjs";
import { resolveComponentBindings } from "../skill-support/scripts/component-mapping-resolver.mjs";
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const contracts = JSON.parse(fs.readFileSync(path.join(root, "packages/component-contracts/src/components.json")));
const { value: registry } = readMappingRegistry(path.join(root, "skill-support/assets/design-system/mapping-registry.json"));
const profile = selectMappingProfile(registry);
const { map } = resolveComponentBindings(profile);
const libraryPage = registryTargetLibrary(registry, profile)?.page ?? "NewComponents";
const output = {
  schemaVersion: 2,
  generatedFrom: "skill-support/assets/design-system/mapping-registry.json",
  readOnly: true,
  policy: { resolveGuidsAtRuntime: true, guidIsNotAStableSource: true, libraryPage, requireLinkedInstance: true, requireVariableReadback: true },
  components: Object.fromEntries(contracts.components.map(component => {
    const binding = map.get(component.logicalName);
    if (!binding) throw new Error("Missing canonical mapping: " + component.logicalName);
    return [component.logicalName, {
      libraryPage,
      pixsoTarget: binding.componentSetName ?? binding.pixsoName ?? null,
      availability: binding.availability,
      ...(binding.mappingReason ? { mappingReason: binding.mappingReason } : {}),
      variant: binding.variant ?? {},
      variantAxes: Object.keys(binding.variant ?? {}),
      slots: component.slots,
    }];
  }))
};
const target = path.join(root, "packages/pixso-mapping/index.json");
const serialized = JSON.stringify(output, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (fs.readFileSync(target, "utf8") !== serialized) throw new Error("Pixso package mapping is stale; run node tools/expand-pixso-mapping.mjs");
} else fs.writeFileSync(target, serialized);
console.log("Pixso package mapping: " + Object.keys(output.components).length + " canonical components.");
