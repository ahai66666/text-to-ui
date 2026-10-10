#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  readMappingRegistry,
  componentFactsEntries,
  componentFactsNames,
  iconColorSourceForMapping,
  registryTargetDocument,
  registryTargetLibrary,
  resolveRegistryPath,
  runtimeSemanticMappingsForProfile,
  selectMappingProfile,
} from "./mapping-registry-lib.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = {};
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (!value.startsWith("--")) continue;
  const key = value.slice(2);
  const next = process.argv[index + 1];
  args[key] = next && !next.startsWith("--") ? next : true;
  if (args[key] !== true) index += 1;
}
const registryPath = path.resolve(
  args.registry || path.join(skillRoot, "assets/design-system/mapping-registry.json"),
);
const { value: registry } = readMappingRegistry(registryPath);
const errors = [];
const warnings = [];

const asArray = (value, label) => {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  return value;
};
const asString = (value, label) => {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${label} must be a non-empty string`);
    return false;
  }
  return true;
};
const uniqueIds = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!asString(item?.id, `${label}.id`)) continue;
    if (seen.has(item.id)) errors.push(`Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
};
const readIfExists = (file, label) => {
  if (!file || !fs.existsSync(file)) {
    errors.push(`${label} does not exist: ${file || "(missing)"}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
};
const setFrom = (items) => new Set(items);
const objectEntries = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value)
    : [];

function scanForPersistedGuid(value, location = "registry") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForPersistedGuid(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (
      normalized === "node_id" ||
      normalized === "file_key" ||
      normalized === "guid" ||
      normalized.endsWith("guid") ||
      normalized.endsWith("guidid") ||
      normalized.includes("component_key")
    ) {
      errors.push(`Persisted Pixso identity is forbidden at ${location}.${key}`);
    }
    scanForPersistedGuid(child, `${location}.${key}`);
  }
}

if (registry.schemaVersion !== 1) errors.push("schemaVersion must be 1");
if (registry.kind !== "text-to-ui.mapping-registry") {
  errors.push("kind must be text-to-ui.mapping-registry");
}
if (!registry.policy?.guidPolicy?.includes("never persist")) {
  errors.push("policy.guidPolicy must forbid persisted Pixso GUIDs");
}
if (!registry.policy?.candidatePolicy?.includes("never identity")) {
  errors.push("policy.candidatePolicy must keep candidates out of identity resolution");
}

const htmlSources = asArray(registry.sources?.html, "sources.html");
const pixsoDocuments = asArray(registry.sources?.pixso, "sources.pixso");
const libraries = asArray(registry.componentLibraries, "componentLibraries");
const profiles = asArray(registry.profiles, "profiles");
uniqueIds(htmlSources, "HTML source");
uniqueIds(pixsoDocuments, "Pixso document");
uniqueIds(libraries, "component library");
uniqueIds(profiles, "mapping profile");

const defaultProfile = profiles.find((profile) => profile.id === registry.defaultProfile);
if (!defaultProfile) errors.push(`defaultProfile not found: ${registry.defaultProfile || "(missing)"}`);
const selectedProfile = args.profile
  ? profiles.find((profile) => profile.id === args.profile)
  : defaultProfile;
if (args.profile && !selectedProfile) errors.push(`profile not found: ${args.profile}`);

for (const source of htmlSources) {
  for (const field of ["root", "componentContract", "componentIndex", ...((source.tokenSources || []).map(() => "tokenSources"))]) {
    if (field === "tokenSources") continue;
    if (source[field]) {
      const resolved = resolveRegistryPath(registryPath, source[field]);
      if (!fs.existsSync(resolved)) {
        const optional = (source.optionalPaths || []).includes(field);
        const message = `HTML source path missing: ${source.id}.${field} -> ${resolved}`;
        if (optional) warnings.push(`${message} (optional in an installed Skill mirror)`);
        else errors.push(message);
      }
    }
  }
  for (const tokenSource of source.tokenSources || []) {
    const resolved = resolveRegistryPath(registryPath, tokenSource);
    if (!fs.existsSync(resolved)) errors.push(`HTML token source missing: ${source.id} -> ${resolved}`);
  }
}
for (const document of pixsoDocuments) {
  for (const field of ["variables", "componentRegistry", "componentSpecs", "componentFacts"]) {
    if (!document[field]) continue;
    const resolved = resolveRegistryPath(registryPath, document[field]);
    if (!fs.existsSync(resolved)) errors.push(`Pixso document path missing: ${document.id}.${field} -> ${resolved}`);
  }
}
for (const projection of Object.entries(registry.projections || {})) {
  const resolved = resolveRegistryPath(registryPath, projection[1]);
  if (!fs.existsSync(resolved)) errors.push(`Projection path missing: ${projection[0]} -> ${resolved}`);
}

const htmlSourceById = new Map(htmlSources.map((item) => [item.id, item]));
const pixsoDocumentById = new Map(pixsoDocuments.map((item) => [item.id, item]));
const libraryById = new Map(libraries.map((item) => [item.id, item]));
for (const profile of profiles) {
  const htmlSource = htmlSourceById.get(profile.sourceHtml);
  if (!htmlSource) errors.push(`${profile.id}: unknown sourceHtml ${profile.sourceHtml}`);
  const htmlIndex = htmlSource
    ? readIfExists(resolveRegistryPath(registryPath, htmlSource.componentIndex), `${profile.id} HTML component index`)
    : null;
  const htmlComponentNames = new Set((htmlIndex?.components || []).map((item) => item.logicalName));
  const htmlContract = htmlSource?.componentContract
    ? readIfExists(resolveRegistryPath(registryPath, htmlSource.componentContract), `${profile.id} HTML component contract`)
    : null;
  const htmlContractComponents = Array.isArray(htmlContract)
    ? htmlContract
    : (htmlContract?.components || []);
  const htmlContractIds = new Set(
    htmlContractComponents.flatMap((item) => [
      item.id,
      ...(item.specimens || []).map((specimen) => specimen.id),
    ]).filter(Boolean),
  );
  const targetDocument = pixsoDocumentById.get(profile.targetPixsoDocument);
  if (!targetDocument) errors.push(`${profile.id}: unknown targetPixsoDocument ${profile.targetPixsoDocument}`);
  const targetLibrary = libraryById.get(profile.targetComponentLibrary);
  if (!targetLibrary) errors.push(`${profile.id}: unknown targetComponentLibrary ${profile.targetComponentLibrary}`);
  if (profile.nativeSourceLibrary && !libraryById.has(profile.nativeSourceLibrary)) {
    errors.push(`${profile.id}: unknown nativeSourceLibrary ${profile.nativeSourceLibrary}`);
  }
  const profileProjectionPaths = {
    ...(registry.projections || {}),
    ...(profile.projections || {}),
  };
  for (const [name, relativePath] of Object.entries(profileProjectionPaths)) {
    const resolved = resolveRegistryPath(registryPath, relativePath);
    if (!fs.existsSync(resolved)) errors.push(`Projection path missing: ${profile.id}.${name} -> ${resolved}`);
  }

  const targetVariables = new Set();
  if (targetDocument?.variables) {
    const manifest = readIfExists(resolveRegistryPath(registryPath, targetDocument.variables), `${profile.id} Pixso variable manifest`);
    for (const collection of manifest?.collections || []) {
      for (const name of Object.keys(collection.variables || {})) targetVariables.add(name);
    }
  }
  const targetRegistry = targetLibrary?.registry
    ? readIfExists(resolveRegistryPath(registryPath, targetLibrary.registry), `${profile.id} Pixso component registry`)
    : null;
  const targetFacts = targetLibrary?.facts
    ? readIfExists(resolveRegistryPath(registryPath, targetLibrary.facts), `${profile.id} Pixso component facts`)
    : targetDocument?.componentFacts
      ? readIfExists(resolveRegistryPath(registryPath, targetDocument.componentFacts), `${profile.id} Pixso component facts`)
      : null;
  if (targetFacts) {
    if (targetFacts.schemaVersion !== 1) errors.push(`${profile.id} Pixso component facts schemaVersion must be 1`);
    if (targetFacts.kind !== "text-to-ui.pixso-component-facts") errors.push(`${profile.id} Pixso component facts kind is invalid`);
    if (!Array.isArray(targetFacts.componentSets)) errors.push(`${profile.id} Pixso component facts componentSets must be an array`);
    if (!Array.isArray(targetFacts.standaloneComponents)) errors.push(`${profile.id} Pixso component facts standaloneComponents must be an array`);
  }
  const targetRegistryNames = new Set(Object.values(targetRegistry?.categories || {}).flat());
  const targetNames = targetFacts ? componentFactsNames(targetFacts) : targetRegistryNames;
  const targetFactsByName = new Map(componentFactsEntries(targetFacts).map((item) => [item.name, item]));
  const targetSpecs = targetLibrary?.specs
    ? readIfExists(resolveRegistryPath(registryPath, targetLibrary.specs), `${profile.id} Pixso component specs`)
    : null;
  const specNames = new Set(Object.keys(targetSpecs?.components || {}));

  const tokenMappings = asArray(profile.tokenMappings, `${profile.id}.tokenMappings`);
  const tokenCss = new Set();
  for (const [index, mapping] of tokenMappings.entries()) {
    const label = `${profile.id}.tokenMappings[${index}]`;
    asString(mapping?.htmlCssVariable, `${label}.htmlCssVariable`);
    asString(mapping?.pixsoVariable, `${label}.pixsoVariable`);
    if (mapping?.htmlCssVariable && tokenCss.has(mapping.htmlCssVariable)) {
      errors.push(`Duplicate canonical HTML CSS variable: ${mapping.htmlCssVariable}`);
    }
    if (mapping?.htmlCssVariable) tokenCss.add(mapping.htmlCssVariable);
    if (mapping?.pixsoVariable && !targetVariables.has(mapping.pixsoVariable)) {
      errors.push(`${label}: Pixso Variable is not in target manifest: ${mapping.pixsoVariable}`);
    }
  }

  const semanticMappings = asArray(profile.semanticTokenMappings, `${profile.id}.semanticTokenMappings`);
  const semanticRoles = new Set();
  for (const [index, mapping] of semanticMappings.entries()) {
    const label = `${profile.id}.semanticTokenMappings[${index}]`;
    asString(mapping?.role, `${label}.role`);
    if (mapping?.role && semanticRoles.has(mapping.role)) errors.push(`Duplicate semantic role: ${mapping.role}`);
    if (mapping?.role) semanticRoles.add(mapping.role);
    if (mapping?.pixsoVariable && !targetVariables.has(mapping.pixsoVariable)) {
      errors.push(`${label}: Pixso Variable is not in target manifest: ${mapping.pixsoVariable}`);
    }
  }

  if (profile.runtimeSemanticMappings != null) {
    errors.push(`${profile.id}.runtimeSemanticMappings is generated; remove it and use runtimeSemanticAliases.`);
  }
  const runtimeSemanticAliases = asArray(
    profile.runtimeSemanticAliases ?? [],
    `${profile.id}.runtimeSemanticAliases`,
  );
  const runtimeAliasRoles = new Set();
  for (const [index, mapping] of runtimeSemanticAliases.entries()) {
    const label = `${profile.id}.runtimeSemanticAliases[${index}]`;
    asString(mapping?.role, `${label}.role`);
    asString(mapping?.htmlCssVariable, `${label}.htmlCssVariable`);
    asString(mapping?.pixsoVariable, `${label}.pixsoVariable`);
    if (mapping?.role && runtimeAliasRoles.has(mapping.role)) {
      errors.push(`Duplicate runtime semantic alias role: ${mapping.role}`);
    }
    if (mapping?.role) runtimeAliasRoles.add(mapping.role);
    if (mapping?.role && semanticRoles.has(mapping.role)) {
      errors.push(`${label}: runtime-only alias role is already defined by semanticTokenMappings: ${mapping.role}`);
    }
    if (mapping?.pixsoVariable && !targetVariables.has(mapping.pixsoVariable)) {
      errors.push(`${label}: Pixso Variable is not in target manifest: ${mapping.pixsoVariable}`);
    }
  }

  const runtimeSemanticMappings = runtimeSemanticMappingsForProfile(profile);
  const runtimeSemanticRoles = new Set();
  for (const [index, mapping] of runtimeSemanticMappings.entries()) {
    const label = `${profile.id}.runtimeSemanticMappings[${index}]`;
    asString(mapping?.role, `${label}.role`);
    if (mapping?.role && runtimeSemanticRoles.has(mapping.role)) {
      errors.push(`Duplicate runtime semantic role: ${mapping.role}`);
    }
    if (mapping?.role) runtimeSemanticRoles.add(mapping.role);
    if (mapping?.pixsoVariable && !targetVariables.has(mapping.pixsoVariable)) {
      errors.push(`${label}: Pixso Variable is not in target manifest: ${mapping.pixsoVariable}`);
    }
  }

  const semanticColors = asArray(profile.semanticColorMappings, `${profile.id}.semanticColorMappings`);
  const semanticColorRoles = new Set();
  for (const [index, mapping] of semanticColors.entries()) {
    const label = `${profile.id}.semanticColorMappings[${index}]`;
    asString(mapping?.role, `${label}.role`);
    if (mapping?.role && semanticColorRoles.has(mapping.role)) errors.push(`Duplicate semantic color role: ${mapping.role}`);
    if (mapping?.role) semanticColorRoles.add(mapping.role);
    for (const pixsoVariable of mapping.pixsoVariables || []) {
      if (!targetVariables.has(pixsoVariable)) {
        errors.push(`${label}: Pixso Variable is not in target manifest: ${pixsoVariable}`);
      }
    }
  }

  const styleMappings = asArray(profile.styleMappings, `${profile.id}.styleMappings`);
  const styleKeys = new Set();
  for (const [index, mapping] of styleMappings.entries()) {
    const label = `${profile.id}.styleMappings[${index}]`;
    asString(mapping?.kind, `${label}.kind`);
    asString(mapping?.htmlToken, `${label}.htmlToken`);
    if (mapping?.pixsoStyle != null) asString(mapping.pixsoStyle, `${label}.pixsoStyle`);
    const key = `${mapping?.kind}:${mapping?.htmlToken}`;
    if (styleKeys.has(key)) errors.push(`Duplicate style mapping: ${key}`);
    styleKeys.add(key);
  }

  const componentMappings = asArray(profile.componentMappings, `${profile.id}.componentMappings`);
  const componentNames = new Set();
  for (const [index, mapping] of componentMappings.entries()) {
    const label = `${profile.id}.componentMappings[${index}]`;
    asString(mapping?.htmlLogicalName, `${label}.htmlLogicalName`);
    if (mapping?.htmlLogicalName && componentNames.has(mapping.htmlLogicalName)) {
      errors.push(`Duplicate HTML logicalName: ${mapping.htmlLogicalName}`);
    }
    if (mapping?.htmlLogicalName) componentNames.add(mapping.htmlLogicalName);
    if (mapping?.htmlLogicalName && htmlComponentNames.size && !htmlComponentNames.has(mapping.htmlLogicalName)) {
      errors.push(`${label}: HTML logicalName is not in component contract: ${mapping.htmlLogicalName}`);
    }
    if (mapping?.pixsoTargetStatus === "registered") {
      if (!mapping.pixsoTarget) errors.push(`${label}: registered target is missing pixsoTarget`);
      else if (!targetNames.has(mapping.pixsoTarget)) errors.push(`${label}: target is not in Pixso registry: ${mapping.pixsoTarget}`);
      if (!mapping.pixsoSpecKey) errors.push(`${label}: registered target is missing pixsoSpecKey`);
      else if (!specNames.has(mapping.pixsoSpecKey)) errors.push(`${label}: pixsoSpecKey is not in Pixso specs: ${mapping.pixsoSpecKey}`);
      const runtime = mapping.runtimeBinding ?? {};
      const targetFact = targetFactsByName.get(runtime.componentSetName ?? runtime.pixsoName ?? mapping.pixsoTarget);
      for (const [htmlVariant, pixsoVariant] of objectEntries(runtime.variantByHtml)) {
        if (!pixsoVariant || typeof pixsoVariant !== "object" || Array.isArray(pixsoVariant)) {
          errors.push(`${label}.runtimeBinding.variantByHtml.${htmlVariant} must be an object`);
          continue;
        }
        for (const [axis, value] of Object.entries(pixsoVariant)) {
          const values = targetFact?.variantAxes?.[axis] ?? [];
          if (!values.some((candidate) => String(candidate).toLowerCase() === String(value).toLowerCase())) {
            errors.push(`${label}.runtimeBinding.variantByHtml.${htmlVariant}: missing Pixso variant ${axis}=${value}`);
          }
        }
      }
      for (const [propName, propVariants] of objectEntries(runtime.variantByProp)) {
        for (const [propValue, pixsoVariant] of objectEntries(propVariants)) {
          if (!pixsoVariant || typeof pixsoVariant !== "object" || Array.isArray(pixsoVariant)) {
            errors.push(`${label}.runtimeBinding.variantByProp.${propName}.${propValue} must be an object`);
            continue;
          }
          for (const [axis, value] of Object.entries(pixsoVariant)) {
            const values = targetFact?.variantAxes?.[axis] ?? [];
            if (!values.some((candidate) => String(candidate).toLowerCase() === String(value).toLowerCase())) {
              errors.push(`${label}.runtimeBinding.variantByProp.${propName}.${propValue}: missing Pixso variant ${axis}=${value}`);
            }
          }
        }
      }
    }
    if (mapping?.pixsoTargetStatus === "pending-review") {
      if (!mapping.pixsoTarget) errors.push(`${label}: pending-review target is missing pixsoTarget`);
      if (!mapping.pixsoMappingReason || typeof mapping.pixsoMappingReason !== "string") {
        errors.push(`${label}: pending-review mapping requires pixsoMappingReason`);
      }
      const message = `${label}: Pixso target is pending review: ${mapping.pixsoTarget ?? "(missing)"}`;
      if (args["strict-component-gates"]) errors.push(message);
      else warnings.push(message);
    }
    if (mapping?.pixsoTargetStatus === "unregistered" && mapping.pixsoTarget != null) {
      errors.push(`${label}: unregistered target must use pixsoTarget=null`);
    }
    if (mapping?.pixsoMappingPolicy != null && !["required", "excluded"].includes(mapping.pixsoMappingPolicy)) {
      errors.push(`${label}: invalid pixsoMappingPolicy`);
    }
    if (mapping?.pixsoMappingPolicy === "excluded") {
      if (mapping.pixsoTargetStatus !== "unregistered" || mapping.pixsoTarget != null) {
        errors.push(`${label}: excluded mapping must be unregistered with pixsoTarget=null`);
      }
      if (!mapping.pixsoMappingReason || typeof mapping.pixsoMappingReason !== "string") {
        errors.push(`${label}: excluded mapping requires pixsoMappingReason`);
      }
    }
    if (!["mapped-pending-verification", "mapped-needs-rebuild", "verified", "missing-target", "not-applicable"].includes(mapping?.nativeSourceStatus)) {
      errors.push(`${label}: invalid nativeSourceStatus`);
    }
    for (const [subIndex, submapping] of (mapping.subcomponentMappings || []).entries()) {
      const sublabel = `${label}.subcomponentMappings[${subIndex}]`;
      for (const field of ["htmlRole", "htmlSlot", "htmlSelector", "cardinality", "pixsoTarget", "textToUiSpecKey"]) {
        asString(submapping?.[field], `${sublabel}.${field}`);
      }
      if (submapping?.pixsoTarget && !targetNames.has(submapping.pixsoTarget)) {
        errors.push(`${sublabel}: target is not in Pixso registry: ${submapping.pixsoTarget}`);
      }
      if (submapping?.textToUiSpecKey && !specNames.has(submapping.textToUiSpecKey)) {
        errors.push(`${sublabel}: textToUiSpecKey is not in Pixso specs: ${submapping.textToUiSpecKey}`);
      }
      if (!submapping?.variantByHtmlSize || typeof submapping.variantByHtmlSize !== "object" || Array.isArray(submapping.variantByHtmlSize)) {
        errors.push(`${sublabel}: variantByHtmlSize must be an object`);
      }
      for (const [actionIndex, action] of (submapping.actions || []).entries()) {
        const actionLabel = `${sublabel}.actions[${actionIndex}]`;
        for (const field of ["htmlAction", "pixsoLayer", "iconAlias"]) {
          asString(action?.[field], `${actionLabel}.${field}`);
        }
      }
    }
  }
  const endpointComponentMappings = asArray(
    profile.endpointComponentMappings,
    `${profile.id}.endpointComponentMappings`,
  );
  const endpointComponentIds = new Set();
  for (const [index, mapping] of endpointComponentMappings.entries()) {
    const label = `${profile.id}.endpointComponentMappings[${index}]`;
    asString(mapping?.endpointComponentId, `${label}.endpointComponentId`);
    asString(mapping?.contractId, `${label}.contractId`);
    asString(mapping?.htmlLogicalName, `${label}.htmlLogicalName`);
    if (mapping?.endpointComponentId && endpointComponentIds.has(mapping.endpointComponentId)) {
      errors.push(`Duplicate endpoint component ID: ${mapping.endpointComponentId}`);
    }
    if (mapping?.endpointComponentId) endpointComponentIds.add(mapping.endpointComponentId);
    if (htmlContractIds.size && mapping?.endpointComponentId && !htmlContractIds.has(mapping.endpointComponentId)) {
      errors.push(`${label}: endpointComponentId is not in HTML component contract: ${mapping.endpointComponentId}`);
    }
    if (
      mapping?.htmlLogicalName &&
      !specNames.has(mapping.htmlLogicalName) &&
      !componentNames.has(mapping.htmlLogicalName)
    ) {
      errors.push(`${label}: htmlLogicalName is neither an HTML component identity nor a Pixso spec key: ${mapping.htmlLogicalName}`);
    }
    if (!mapping?.pixsoTargetStatus || !["registered", "pending-review", "unregistered"].includes(mapping.pixsoTargetStatus)) {
      errors.push(`${label}: invalid pixsoTargetStatus`);
    }
    if (mapping?.pixsoTargetStatus === "registered") {
      if (!mapping.pixsoTarget) errors.push(`${label}: registered target is missing pixsoTarget`);
      else if (!targetNames.has(mapping.pixsoTarget)) errors.push(`${label}: target is not in Pixso registry: ${mapping.pixsoTarget}`);
      if (!mapping.pixsoVariant || typeof mapping.pixsoVariant !== "object" || Array.isArray(mapping.pixsoVariant)) {
        errors.push(`${label}: registered target requires pixsoVariant object`);
      }
    }
    if (mapping?.pixsoTargetStatus === "pending-review") {
      if (!mapping.pixsoTarget) errors.push(`${label}: pending-review target is missing pixsoTarget`);
      const message = `${label}: Pixso target is pending review: ${mapping.pixsoTarget ?? "(missing)"}`;
      if (args["strict-component-gates"]) errors.push(message);
      else warnings.push(message);
    }
    if (mapping?.pixsoTargetStatus === "unregistered" && mapping.pixsoTarget != null) {
      errors.push(`${label}: unregistered target must use pixsoTarget=null`);
    }
    if (![
      "mapped-pending-verification",
      "verified",
      "mapped-needs-rebuild",
      "unavailable",
    ].includes(mapping?.mappingStatus)) {
      errors.push(`${label}: invalid mappingStatus`);
    }
  }
  if (profile.status === "active" && htmlComponentNames.size) {
    const declaredComponentNames = new Set([...componentNames, ...(profile.componentAliases || []).map((item) => item.logicalName)]);
    for (const name of htmlComponentNames) if (!declaredComponentNames.has(name)) errors.push(`${profile.id}: active profile is missing component mapping ${name}`);
    for (const name of componentNames) if (!htmlComponentNames.has(name)) errors.push(`${profile.id}: component mapping is outside HTML contract ${name}`);
  }

  const nativeMappings = asArray(profile.nativeSourceMappings, `${profile.id}.nativeSourceMappings`);
  const nativeTargets = new Set();
  for (const [index, mapping] of nativeMappings.entries()) {
    const target = mapping.targetHtmlLogicalName || mapping.target;
    const label = `${profile.id}.nativeSourceMappings[${index}]`;
    asString(target, `${label}.targetHtmlLogicalName`);
    if (
      target &&
      htmlComponentNames.size &&
      !htmlComponentNames.has(target) &&
      !targetRegistryNames.has(target)
    ) {
      errors.push(`${label}: native target is not in HTML contract or Pixso registry: ${target}`);
    }
    if (target && nativeTargets.has(target)) errors.push(`Duplicate native source target: ${target}`);
    if (target) nativeTargets.add(target);
  }
  const sourceOnly = asArray(profile.sourceOnly, `${profile.id}.sourceOnly`);
  const sourceOnlyNames = new Set();
  for (const item of sourceOnly) {
    if (!asString(item?.name, `${profile.id}.sourceOnly.name`)) continue;
    if (sourceOnlyNames.has(item.name)) errors.push(`Duplicate source-only component: ${item.name}`);
    sourceOnlyNames.add(item.name);
  }

  const expected = profile.summary;
  if (expected) {
    const actual = {
      canonicalTokenMappings: tokenMappings.length,
      semanticTokenMappings: semanticMappings.length,
      runtimeSemanticAliases: runtimeSemanticAliases.length,
      runtimeSemanticMappings: runtimeSemanticMappings.length,
      semanticColorMappings: semanticColors.length,
      styleMappings: styleMappings.length,
      htmlComponents: componentMappings.length,
      endpointComponentMappings: endpointComponentMappings.length,
      registeredPixsoTargets: targetNames.size,
      htmlToPixsoExactMatches: componentMappings.filter((item) => item.pixsoTargetStatus === "registered").length,
      nativeSourceMappings: nativeMappings.length,
    };
    for (const [key, value] of Object.entries(actual)) {
      if (expected[key] !== value) errors.push(`${profile.id}.summary.${key}=${expected[key]} but actual is ${value}`);
    }
  }
}

scanForPersistedGuid(registry);

if (args["check-projections"]) {
  const profile = selectedProfile;
  const projectionPaths = {
    ...(registry.projections || {}),
    ...(profile?.projections || {}),
  };
  const runtime = readIfExists(
    resolveRegistryPath(registryPath, projectionPaths.tokenRuntimeMap),
    "token runtime projection",
  );
  const dual = readIfExists(
    resolveRegistryPath(registryPath, projectionPaths.dualOutputTokenMap),
    "dual-output token projection",
  );
  const native = readIfExists(
    resolveRegistryPath(registryPath, projectionPaths.pixsoNativeComponentMap),
    "Pixso native component projection",
  );
  const canonical = new Map(
    (profile?.tokenMappings || []).map((item) => [
      item.htmlCssVariable,
      JSON.stringify({
        htmlCssVariable: item.htmlCssVariable,
        htmlSourceToken: item.htmlSourceToken,
        pixsoVariable: item.pixsoVariable,
        pixsoCollection: item.pixsoCollection,
        pixsoMode: item.pixsoMode,
        valueTransform: item.valueTransform || "identity",
      }),
    ]),
  );
  const projected = new Map(
    (runtime?.mappings || []).map((item) => [
      item.cssVariable,
      JSON.stringify({
        htmlCssVariable: item.cssVariable,
        htmlSourceToken: item.sourceToken,
        pixsoVariable: item.pixsoVariable,
        pixsoCollection: item.pixsoCollection,
        pixsoMode: item.pixsoMode,
        valueTransform: item.valueTransform || "identity",
      }),
    ]),
  );
  for (const [cssVariable, value] of canonical) {
    if (projected.get(cssVariable) !== value) {
      errors.push(`token-runtime projection drift: ${cssVariable}`);
    }
  }
  const semantic = new Map(
    (profile?.semanticTokenMappings || []).map((item) => [
      item.role,
      JSON.stringify({ role: item.role, htmlCssVariable: item.htmlCssVariable, htmlSourceToken: item.htmlSourceToken, pixsoVariable: item.pixsoVariable, valueTransform: item.valueTransform || "identity" }),
    ]),
  );
  const projectedSemantic = new Map(
    (dual?.semanticTokenMappings || []).map((item) => [
      item.role,
      JSON.stringify({ role: item.role, htmlCssVariable: item.webCssVariable, htmlSourceToken: item.sourceToken, pixsoVariable: item.pixsoVariable, valueTransform: item.valueTransform || "identity" }),
    ]),
  );
  for (const [role, value] of semantic) {
    if (projectedSemantic.get(role) !== value) errors.push(`dual-output semantic projection drift: ${role}`);
  }
  const runtimeSemantic = new Map(
    runtimeSemanticMappingsForProfile(profile).map((item) => [
      item.role,
      JSON.stringify({
        role: item.role,
        htmlCssVariable: item.htmlCssVariable,
        htmlSourceToken: item.htmlSourceToken,
        pixsoVariable: item.pixsoVariable,
        valueTransform: item.valueTransform || "identity",
      }),
    ]),
  );
  const projectedRuntimeSemantic = new Map(
    Object.entries(runtime?.semanticRoles || {}).map(([role, item]) => [
      role,
      JSON.stringify({
        role,
        htmlCssVariable: item.cssVariable,
        htmlSourceToken: item.sourceToken,
        pixsoVariable: item.pixsoVariable,
        valueTransform: item.valueTransform || "identity",
      }),
    ]),
  );
  for (const [role, value] of runtimeSemantic) {
    if (projectedRuntimeSemantic.get(role) !== value) errors.push(`token-runtime semantic projection drift: ${role}`);
  }
  if (native) {
    if (native.projectionKind !== "generated-compatibility-projection") errors.push("Pixso native component projection is not marked generated");
    if (native.generatedFrom !== "mapping-registry.json") errors.push("Pixso native component projection has an invalid source marker");
    if (native.readOnly !== true) errors.push("Pixso native component projection must be readOnly");
    for (const mapping of native.mappings || []) {
      const expectedIconColorSource = iconColorSourceForMapping(mapping);
      if (expectedIconColorSource && mapping.iconColorSource !== expectedIconColorSource) {
        errors.push(`Pixso native component projection missing ${expectedIconColorSource}: ${mapping.logicalName}`);
      }
    }
  }
  if (!runtime || !dual) warnings.push("Projection check skipped because a projection file is unavailable.");
}

if (errors.length) {
  console.error("Mapping registry is invalid:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const profile = defaultProfile || profiles[0];
console.log(
  `Mapping registry valid: ${profiles.length} profile(s), ${profile?.tokenMappings?.length || 0} canonical Token mappings, ${profile?.componentMappings?.length || 0} Component mappings` +
    (args["check-projections"] ? "; projections checked." : "."),
);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
