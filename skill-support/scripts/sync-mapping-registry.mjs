#!/usr/bin/env node

import fs from "node:fs";
import { output as runtimeFoundation } from "./build-token-runtime-map.mjs";
import { output as dualFoundation } from "./build-dual-output-token-map.mjs";
import { resolveComponentBindings } from "./component-mapping-resolver.mjs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  componentFactsNames,

  readMappingRegistry,
  refreshMappingProfileSummary,
  registryTargetLibrary,
  resolveRegistryPath,
  runtimeSemanticMappingsForProfile,
  selectMappingProfile,
} from "./mapping-registry-lib.mjs";

const args = {};
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (!value.startsWith("--")) continue;
  const key = value.slice(2);
  const next = process.argv[index + 1];
  args[key] = next && !next.startsWith("--") ? next : true;
  if (args[key] !== true) index += 1;
}

const defaultRegistry = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets/design-system/mapping-registry.json",
);
const registryFile = path.resolve(args.registry || defaultRegistry);
const { value: registry } = readMappingRegistry(registryFile);
const profile = selectMappingProfile(registry, args.profile || null);
const writeMode = args.write === true || String(args.write).toLowerCase() === "true";
const checkMode = args.check === true || String(args.check).toLowerCase() === "true";
if (writeMode && checkMode) throw new Error("Choose only one of --write or --check.");
if (!writeMode && !checkMode) throw new Error("Use --check to inspect or --write to update projections.");

const read = (relativePath) => {
  const file = resolveRegistryPath(registryFile, relativePath);
  return { file, value: fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {} };
};
const stable = (value) => JSON.stringify(value, null, 2) + "\n";
const changes = [];
const fail = (message) => {
  throw new Error(message);
};

// The profile summary is derived data. Refresh it from the same facts file
// that validation uses so component-facts sync cannot leave a stale count
// behind (for example summary=19 while the new snapshot contains 23 targets).
const targetLibrary = registryTargetLibrary(registry, profile);
const targetFactsFile = targetLibrary?.facts
  ? resolveRegistryPath(registryFile, targetLibrary.facts)
  : null;
const targetFacts = targetFactsFile && fs.existsSync(targetFactsFile)
  ? JSON.parse(fs.readFileSync(targetFactsFile, "utf8"))
  : null;
const summaryChanged = refreshMappingProfileSummary(
  profile,
  targetFacts ? componentFactsNames(targetFacts) : null,
);

const runCoverageProjectionCheck = (mode, projectionPaths) => {
  if (profile.id !== registry.defaultProfile) return;
  const configuredCoverage = resolveRegistryPath(
    registryFile,
    projectionPaths.harmonyosCoverageTable,
  );
  const defaultCoverage = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../assets/design-system/harmonyos-component-mapping-table.json",
  );
  if (!configuredCoverage || path.resolve(configuredCoverage) !== path.resolve(defaultCoverage)) return;
  const builder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "build-harmonyos-component-mapping-table.mjs",
  );
  const result = spawnSync(process.execPath, [builder, mode], {
    cwd: path.dirname(path.dirname(builder)),
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const projectionPaths = {
  ...(registry.projections || {}),
  ...(profile.projections || {}),
};
if (!projectionPaths) fail(`Profile ${profile.id} has no projection paths.`);
const runtimeProjection = read(projectionPaths.tokenRuntimeMap);
const dualProjection = read(projectionPaths.dualOutputTokenMap);
const nativeProjection = read(projectionPaths.pixsoNativeComponentMap);
const adapterProjection = read(projectionPaths.harmonyosComponentAdapterMap);

const runtimeSemanticByRole = new Map(
  runtimeSemanticMappingsForProfile(profile).map((mapping) => [mapping.role, mapping]),
);
const indexBy = (rows, key) => new Map(rows.map(row => [row[key], row]));
const runtimeFoundationByCss = indexBy(runtimeFoundation.mappings, "cssVariable");
const dualFoundationByCss = indexBy(dualFoundation.variableMappings, "webCssVariable");
const dualFoundationByRole = indexBy(dualFoundation.semanticTokenMappings, "role");
const colorFoundationByRole = indexBy(dualFoundation.semanticColorMappings, "role");

const nextRuntime = {
  ...runtimeFoundation,
  mappings: (profile.tokenMappings || []).map((central) => {
    const mapping = runtimeFoundationByCss.get(central.htmlCssVariable);
    if (!mapping) fail(`Missing foundation metadata for ${central.htmlCssVariable}`);
    return {
      ...mapping,
      pixsoCollection: central.pixsoCollection ?? mapping.pixsoCollection,
      pixsoMode: central.pixsoMode ?? mapping.pixsoMode,
      pixsoVariable: central.pixsoVariable,
      sourceToken: central.htmlSourceToken ?? mapping.sourceToken,
      valueTransform: central.valueTransform || "identity",
    };
  }),
  semanticRoles: Object.fromEntries(
    [...new Set([...Object.keys(runtimeFoundation.semanticRoles).filter(role => runtimeSemanticByRole.has(role)), ...runtimeSemanticByRole.keys()])].map(role => {
      const central = runtimeSemanticByRole.get(role);
      const mapping = runtimeFoundation.semanticRoles[role] ?? runtimeFoundationByCss.get(central.htmlCssVariable);
      if (!mapping) fail(`Missing foundation metadata for semantic role ${role}`);
      return [
        role,
        {
          ...mapping,
          cssVariable: central.htmlCssVariable ?? mapping.cssVariable,
          pixsoVariable: central.pixsoVariable,
          sourceToken: central.htmlSourceToken ?? mapping.sourceToken,
          valueTransform: central.valueTransform || "identity",
        },
      ];
    }),
  ),
};

const nextDual = {
  ...dualFoundation,
  variableMappings: (profile.tokenMappings || []).map((central) => {
    const mapping = dualFoundationByCss.get(central.htmlCssVariable);
    if (!mapping) fail(`Missing dual-output metadata for ${central.htmlCssVariable}`);
    return {
      ...mapping,
      pixsoVariable: central.pixsoVariable,
      collection: central.pixsoCollection ?? mapping.collection,
      sourceToken: central.htmlSourceToken ?? mapping.sourceToken,
      valueTransform: central.valueTransform || "identity",
    };
  }),
  semanticTokenMappings: (profile.semanticTokenMappings || []).map((central) => {
    const mapping = dualFoundationByRole.get(central.role);
    if (!mapping) fail(`Missing dual-output metadata for ${central.role}`);
    return {
      ...mapping,
      webCssVariable: central.htmlCssVariable,
      pixsoVariable: central.pixsoVariable,
      sourceToken: central.htmlSourceToken ?? mapping.sourceToken,
      valueTransform: central.valueTransform || "identity",
    };
  }),
  semanticColorMappings: (profile.semanticColorMappings || []).map((central) => {
    const mapping = colorFoundationByRole.get(central.role);
    if (!mapping) fail(`Missing color foundation metadata for ${central.role}`);
    return {
      ...mapping,
      webCssVariables: central.htmlCssVariables,
      pixsoVariables: central.pixsoVariables,
      composition: central.composition,
    };
  }),
};

const nextNative = {
  "$schema": "./pixso-native-component-map.schema.json",
  "schemaVersion": 1,
  "resolution": "exact-symbolic-name-at-runtime",
  policy: {
    persistDocumentGuids: false,
    mappedOnlyWhenAvailabilityIsMapped: true,
    unmappedFallback: "native-composition",
    doNotGuessAliases: true,
    editSource: "mapping-registry.json",
    mappedInstanceColorOwner: "pixso-variant",
    mappedIconColorSource: "variant-content",
  },
  projectionKind: "generated-compatibility-projection",
  generatedFrom: "mapping-registry.json",
  generatedBy: "scripts/sync-mapping-registry.mjs",
  readOnly: true,
  libraryPage: profile.targetComponentLibrary
    ? registry.componentLibraries?.find((item) => item.id === profile.targetComponentLibrary)?.page ||
      "NewComponents"
    : "NewComponents",
  mappings: resolveComponentBindings(profile).mappings,
  endpointComponentMappings: (profile.endpointComponentMappings || []).map((mapping) => ({
    endpointComponentId: mapping.endpointComponentId,
    contractId: mapping.contractId,
    logicalName: mapping.htmlLogicalName,
    pixsoName: mapping.pixsoTarget,
    componentSetName: mapping.pixsoTarget,
    availability: mapping.pixsoTargetStatus === "registered"
      ? "mapped"
      : mapping.pixsoTargetStatus === "pending-review" ? "pending-review" : "blocked",
    variant: mapping.pixsoVariant || {},
    mappingStatus: mapping.mappingStatus,
    sourceMappingTarget: mapping.sourceMappingTarget || mapping.htmlLogicalName,
  })),
};

const nextAdapter = {
  "schemaVersion": 2,
  "sourceLibrary": "HarmonyOS Component Library",
  "sourcePage": "NewComponents",
  "targetLibrary": "鸿蒙客户端设计规范",
  "policy": {"componentSetsAreSourceOnly":false,"registeredTargetsRemainStandaloneUntilTakeoverGate":true,"verifiedComponentSetVariantsMayBecomeActiveProviders":true,"nativeDeletionByCodex":false,"migrationRegistry":"assets/design-system/pixso-component-migration.json","resolveSourceByExactNameAndAxes":true,"persistSourceGuids":false,"copyStructureBeforeBinding":true,"forbidIconFontsInTargets":true,"requireTextStyles":true,"requireVariableBindings":true,"partialCoverageAllowed":true,"strictParityRequiresEveryUsedTargetVerified":true,"coverageArtifact":"assets/design-system/harmonyos-component-mapping-table.json"},
  "surfaceSemantics": {"whiteContext":"On a white canvas, use the subtle gray control surface.","grayContext":"On a gray canvas, use the white control surface.","nativeGraySceneOn":"Maps to the target Gray Surface context because the native control itself is white.","nativeGraySceneOff":"Maps to the target White Surface context because the native control itself is subtle gray."},
  adapters: (profile.nativeSourceMappings || []).map((mapping) => {
    const { sourceLibrary, targetHtmlLogicalName, ...projected } = mapping;
    return projected;
  }),
  sourceOnly: (profile.sourceOnly || []).map((mapping) => {
    const { sourceLibrary, ...projected } = mapping;
    return projected;
  }),
};

for (const [label, current, next] of [
  ["token runtime map", runtimeProjection.value, nextRuntime],
  ["dual-output token map", dualProjection.value, nextDual],
  ["Pixso native component map", nativeProjection.value, nextNative],
  ["HarmonyOS component adapter map", adapterProjection.value, nextAdapter],
]) {
  const currentText = stable(current);
  const nextText = stable(next);
  if (currentText !== nextText) changes.push({ label, file: current === runtimeProjection.value ? runtimeProjection.file : current === dualProjection.value ? dualProjection.file : current === nativeProjection.value ? nativeProjection.file : adapterProjection.file, next });
}

if (summaryChanged) {
  changes.unshift({
    label: "mapping registry summary",
    file: registryFile,
    next: registry,
  });
}

if (checkMode) {
  if (changes.length) {
    console.error("Mapping registry projections or derived summary are out of date:");
    for (const change of changes) console.error("- " + change.label + ": " + change.file);
    process.exit(1);
  }
  runCoverageProjectionCheck("--check", projectionPaths);
  console.log("Mapping registry projections are current for profile " + profile.id + ".");
} else {
  for (const change of changes) {
    fs.writeFileSync(change.file, stable(change.next));
    console.log("Updated " + change.file);
  }
  runCoverageProjectionCheck("--write", projectionPaths);
  console.log("Mapping registry projections synchronized for profile " + profile.id + ".");
}
