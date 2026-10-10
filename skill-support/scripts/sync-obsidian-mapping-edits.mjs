#!/usr/bin/env node

import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MAPPING_REGISTRY,
  componentFactsNames,
  readMappingRegistry,
  registryTargetLibrary,
  resolveRegistryPath,
  runtimeSemanticMappingsForProfile,
} from "./mapping-registry-lib.mjs";
import {
  markRowsApplied,
  parseEditQueue,
} from "./obsidian-mapping-edit-lib.mjs";

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

const notePath = args.note ? path.resolve(args.note) : null;
const registryPath = path.resolve(args.registry || DEFAULT_MAPPING_REGISTRY);
const writeMode = Boolean(args.write);
const checkMode = Boolean(args.check);

if (!notePath) {
  throw new Error("Use --note /absolute/path/to/Text-to-UI-mapping-workbook.md.");
}
if (writeMode === checkMode) {
  throw new Error("Choose exactly one of --check or --write.");
}
if (!fs.existsSync(notePath)) throw new Error(`Obsidian note does not exist: ${notePath}`);

const noteText = fs.readFileSync(notePath, "utf8");
const { rows } = parseEditQueue(noteText);
const pendingRows = rows.filter((row) => row.state === "pending");
const ignoredRows = rows.filter((row) => !["pending", "applied", "blocked", "example"].includes(row.state));
if (ignoredRows.length) {
  throw new Error(
    `Unknown edit state(s): ${[...new Set(ignoredRows.map((row) => row.state))].join(", ")}. ` +
    "Use pending, applied, blocked, or example.",
  );
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const stable = (value) => JSON.stringify(value, null, 2) + "\n";
const describe = (value) => value === undefined ? "(unchanged)" : value === null ? "—" : JSON.stringify(value);
const errors = [];
const changes = [];
const seen = new Set();
const currentRegistry = readMappingRegistry(registryPath).value;
const currentHash = crypto.createHash("sha256").update(JSON.stringify(currentRegistry)).digest("hex");
const noteHash = /^registryHash:\s*(\S+)$/m.exec(noteText)?.[1] || null;
if (noteHash && noteHash !== currentHash) {
  const message = `Obsidian workbook is based on registry hash ${noteHash}, but the current registry is ${currentHash}. Rebuild the workbook before applying new edits.`;
  if (pendingRows.length) errors.push(message);
  else console.warn("Warning: " + message);
}
const nextRegistry = clone(currentRegistry);

function profileFor(row) {
  const profileId = row.profile || nextRegistry.defaultProfile;
  const profile = (nextRegistry.profiles || []).find((item) => item.id === profileId);
  if (!profile) throw new Error(`Unknown mapping profile: ${profileId}`);
  return profile;
}

function addChange(label, before, after) {
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  changes.push({ label, before, after });
}

function targetFacts(profile) {
  const library = registryTargetLibrary(nextRegistry, profile);
  const targetRegistryPath = library?.registry
    ? resolveRegistryPath(registryPath, library.registry)
    : null;
  const targetFactsPath = library?.facts
    ? resolveRegistryPath(registryPath, library.facts)
    : null;
  const targetSpecsPath = library?.specs
    ? resolveRegistryPath(registryPath, library.specs)
    : null;
  const targetRegistry = targetRegistryPath && fs.existsSync(targetRegistryPath)
    ? JSON.parse(fs.readFileSync(targetRegistryPath, "utf8"))
    : {};
  const targetSpecs = targetSpecsPath && fs.existsSync(targetSpecsPath)
    ? JSON.parse(fs.readFileSync(targetSpecsPath, "utf8"))
    : {};
  const htmlSource = (nextRegistry.sources?.html || []).find((source) => source.id === profile.sourceHtml);
  const contractPath = htmlSource?.componentContract
    ? resolveRegistryPath(registryPath, htmlSource.componentContract)
    : null;
  const contract = contractPath && fs.existsSync(contractPath)
    ? JSON.parse(fs.readFileSync(contractPath, "utf8"))
    : {};
  const contractComponents = Array.isArray(contract) ? contract : (contract.components || []);
  const contractById = new Map();
  for (const item of contractComponents) {
    if (item.id) contractById.set(item.id, item);
    for (const specimen of item.specimens || []) {
      if (specimen.id) contractById.set(specimen.id, { ...specimen, contractId: item.id });
    }
  }
  const targetFacts = targetFactsPath && fs.existsSync(targetFactsPath)
    ? JSON.parse(fs.readFileSync(targetFactsPath, "utf8"))
    : null;
  const targetNames = targetFacts
    ? componentFactsNames(targetFacts)
    : new Set(Object.values(targetRegistry.categories || {}).flat());
  const specNames = new Set(Object.keys(targetSpecs.components || {}));
  return { targetNames, specNames, contractIds: new Set(contractById.keys()) };
}

function refreshProfileSummary(profile) {
  const { targetNames } = targetFacts(profile);
  if (!profile.summary) return;
  profile.summary = {
    ...profile.summary,
    canonicalTokenMappings: (profile.tokenMappings || []).length,
    semanticTokenMappings: (profile.semanticTokenMappings || []).length,
    runtimeSemanticAliases: (profile.runtimeSemanticAliases || []).length,
    runtimeSemanticMappings: runtimeSemanticMappingsForProfile(profile).length,
    semanticColorMappings: (profile.semanticColorMappings || []).length,
    styleMappings: (profile.styleMappings || []).length,
    htmlComponents: (profile.componentMappings || []).length,
    endpointComponentMappings: (profile.endpointComponentMappings || []).length,
    registeredPixsoTargets: targetNames.size,
    htmlToPixsoExactMatches: (profile.componentMappings || []).filter(
      (item) => item.pixsoTargetStatus === "registered",
    ).length,
    nativeSourceMappings: (profile.nativeSourceMappings || []).length,
  };
}

function setOptional(target, key, value) {
  if (value !== undefined) target[key] = value;
}

function normalizeMappingType(value) {
  const aliases = {
    token: "tokenMappings",
    "canonical-token": "tokenMappings",
    "semantic-token": "semanticTokenMappings",
    "runtime-semantic": "runtimeSemanticAliases",
    "runtime-alias": "runtimeSemanticAliases",
    "semantic-color": "semanticColorMappings",
  };
  return aliases[value] || null;
}

function applyComponent(row, profile) {
  // The workbook has one component table. A runtime component ID is an
  // optional implementation alias of the same HTML logical component, not a
  // separate mapping category.
  if (row.runtimeComponentId !== undefined) {
    if (!row.contractId) {
      throw new Error("runtimeComponentId requires contractId (for example button).");
    }
    return applyEndpointComponent({
      ...row,
      endpointComponentId: row.runtimeComponentId,
      sourceMappingTarget: row.sourceMappingTarget ?? row.htmlLogicalName,
    }, profile);
  }
  const key = `component:${profile.id}:${row.htmlLogicalName}`;
  if (seen.has(key)) throw new Error(`Duplicate pending edit: ${key}`);
  seen.add(key);
  const mappings = profile.componentMappings || (profile.componentMappings = []);
  const index = mappings.findIndex((item) => item.htmlLogicalName === row.htmlLogicalName);
  const action = row.action || "update";
  if (action === "remove") {
    throw new Error(`${key}: remove is not supported; use action=unlink to clear only the Pixso target.`);
  }
  if (action === "add" && index >= 0) throw new Error(`${key}: mapping already exists; use action=update.`);
  if (action === "update" && index < 0) throw new Error(`${key}: mapping does not exist; use action=add.`);
  if (!["add", "update", "unlink"].includes(action)) throw new Error(`${key}: unsupported action ${action}.`);

  const current = index >= 0 ? mappings[index] : null;
  const target = current ? { ...current } : {
    htmlLogicalName: row.htmlLogicalName,
    htmlRendererKey: row.htmlRendererKey ?? null,
    pixsoTarget: null,
    pixsoTargetStatus: "unregistered",
    pixsoSpecKey: null,
    nativeSourceStatus: row.nativeSourceStatus || "not-applicable",
    runtimeBinding: null,
  };
  if (action === "unlink") {
    target.pixsoTarget = null;
    target.pixsoSpecKey = null;
    target.pixsoTargetStatus = "unregistered";
  } else {
    setOptional(target, "htmlRendererKey", row.htmlRendererKey);
    setOptional(target, "pixsoTarget", row.pixsoTarget);
    setOptional(target, "pixsoSpecKey", row.pixsoSpecKey);
    setOptional(target, "pixsoTargetStatus", row.pixsoTargetStatus);
    setOptional(target, "nativeSourceStatus", row.nativeSourceStatus);
    if (row.pixsoTarget !== undefined && row.pixsoTargetStatus === undefined) {
      target.pixsoTargetStatus = row.pixsoTarget === null ? "unregistered" : "registered";
      if (row.pixsoTarget !== null && row.pixsoSpecKey === undefined) target.pixsoSpecKey = row.pixsoTarget;
    }
  }
  const facts = targetFacts(profile);
  if (target.pixsoTargetStatus === "registered") {
    if (!target.pixsoTarget) throw new Error(`${key}: registered target requires pixsoTarget.`);
    if (!facts.targetNames.has(target.pixsoTarget)) {
      throw new Error(`${key}: Pixso target is not an exact registered name: ${target.pixsoTarget}`);
    }
    if (target.pixsoSpecKey && !facts.specNames.has(target.pixsoSpecKey)) {
      throw new Error(`${key}: Pixso spec key does not exist: ${target.pixsoSpecKey}`);
    }
  }
  if (target.pixsoTargetStatus === "unregistered" && target.pixsoTarget !== null) {
    throw new Error(`${key}: unregistered target must use pixsoTarget=—.`);
  }
  if (action === "add") {
    mappings.push(target);
    addChange(key, null, target);
  } else {
    addChange(key, current, target);
    mappings[index] = target;
  }
}

function findMapping(array, row, identityField) {
  const identity = row.htmlIdentity;
  const css = row.htmlCssVariable;
  return array.findIndex((item) => item[identityField] === identity) >= 0
    ? array.findIndex((item) => item[identityField] === identity)
    : css ? array.findIndex((item) => item.htmlCssVariable === css) : -1;
}

function parseJsonCell(value, label, expected) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error.message}`);
  }
  if (expected === "object" && (!parsed || typeof parsed !== "object" || Array.isArray(parsed))) {
    throw new Error(`${label} must be a JSON object.`);
  }
  if (expected === "array" && !Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
  return parsed;
}

function applyComponentSlot(row, profile) {
  const key = `component-slot:${profile.id}:${row.htmlParent}:${row.htmlSlot}:${row.htmlRole}`;
  if (seen.has(key)) throw new Error(`Duplicate pending edit: ${key}`);
  seen.add(key);
  const parent = (profile.componentMappings || []).find((item) => item.htmlLogicalName === row.htmlParent);
  if (!parent) throw new Error(`${key}: parent HTML logicalName does not exist.`);
  const mappings = parent.subcomponentMappings || (parent.subcomponentMappings = []);
  const index = mappings.findIndex((item) => item.htmlSlot === row.htmlSlot && item.htmlRole === row.htmlRole);
  const action = row.action || "update";
  if (!["add", "update"].includes(action)) throw new Error(`${key}: component slot mappings support action=add or action=update.`);
  if (action === "add" && index >= 0) throw new Error(`${key}: mapping already exists; use action=update.`);
  if (action === "update" && index < 0) throw new Error(`${key}: mapping does not exist; use action=add.`);
  const current = index >= 0 ? mappings[index] : null;
  const target = current ? { ...current } : {
    htmlRole: row.htmlRole,
    htmlSlot: row.htmlSlot,
    htmlSelector: row.htmlSelector,
    cardinality: "—",
    pixsoTarget: row.pixsoTarget,
    textToUiSpecKey: row.textToUiSpecKey,
    variantByHtmlSize: {},
    actions: [],
  };
  setOptional(target, "htmlSelector", row.htmlSelector);
  setOptional(target, "pixsoTarget", row.pixsoTarget);
  setOptional(target, "textToUiSpecKey", row.textToUiSpecKey);
  const variants = parseJsonCell(row.variantByHtmlSize, `${key}.variantByHtmlSize`, "object");
  const actions = parseJsonCell(row.actions, `${key}.actions`, "array");
  if (variants !== undefined) target.variantByHtmlSize = variants;
  if (actions !== undefined) target.actions = actions;
  const facts = targetFacts(profile);
  if (!target.pixsoTarget || !facts.targetNames.has(target.pixsoTarget)) {
    throw new Error(`${key}: Pixso target is not an exact registered name: ${target.pixsoTarget || "(missing)"}`);
  }
  if (!target.textToUiSpecKey || !facts.specNames.has(target.textToUiSpecKey)) {
    throw new Error(`${key}: Text-to-UI spec key does not exist: ${target.textToUiSpecKey || "(missing)"}`);
  }
  if (!Array.isArray(target.actions) || !target.actions.length) throw new Error(`${key}: actions must contain at least one action.`);
  if (action === "add") {
    mappings.push(target);
    addChange(key, null, target);
  } else {
    mappings[index] = target;
    addChange(key, current, target);
  }
}

function applyEndpointComponent(row, profile) {
  const key = `endpoint-component:${profile.id}:${row.endpointComponentId}`;
  if (seen.has(key)) throw new Error(`Duplicate pending edit: ${key}`);
  seen.add(key);
  const mappings = profile.endpointComponentMappings || (profile.endpointComponentMappings = []);
  const index = mappings.findIndex((item) => item.endpointComponentId === row.endpointComponentId);
  const action = row.action || "update";
  if (!["add", "update", "unlink"].includes(action)) throw new Error(`${key}: unsupported action ${action}.`);
  if (action === "add" && index >= 0) throw new Error(`${key}: mapping already exists; use action=update.`);
  if (action === "update" && index < 0) throw new Error(`${key}: mapping does not exist; use action=add.`);

  const current = index >= 0 ? mappings[index] : null;
  const target = current ? { ...current } : {
    endpointComponentId: row.endpointComponentId,
    contractId: row.contractId,
    htmlLogicalName: row.htmlLogicalName,
    pixsoTarget: null,
    pixsoTargetStatus: "unregistered",
    pixsoVariant: null,
    mappingStatus: "unavailable",
    sourceMappingTarget: null,
  };
  const facts = targetFacts(profile);
  if (!facts.contractIds.has(target.endpointComponentId)) {
    throw new Error(`${key}: endpointComponentId is not in the HTML component contract: ${target.endpointComponentId}`);
  }
  const isHtmlComponentIdentity = (profile.componentMappings || []).some(
    (mapping) => mapping.htmlLogicalName === target.htmlLogicalName,
  );
  if (!facts.specNames.has(target.htmlLogicalName) && !isHtmlComponentIdentity) {
    throw new Error(`${key}: htmlLogicalName is neither an HTML component identity nor a Pixso spec key: ${target.htmlLogicalName}`);
  }
  if (row.contractId !== undefined) target.contractId = row.contractId;
  if (row.htmlLogicalName !== undefined) target.htmlLogicalName = row.htmlLogicalName;
  if (action === "unlink") {
    target.pixsoTarget = null;
    target.pixsoTargetStatus = "unregistered";
    target.pixsoVariant = null;
    target.mappingStatus = "unavailable";
  } else {
    setOptional(target, "pixsoTarget", row.pixsoTarget);
    setOptional(target, "pixsoTargetStatus", row.pixsoTargetStatus);
    const pixsoVariant = parseJsonCell(row.pixsoVariant, `${key}.pixsoVariant`, "object");
    if (pixsoVariant !== undefined) target.pixsoVariant = pixsoVariant;
    setOptional(target, "mappingStatus", row.mappingStatus);
    setOptional(target, "sourceMappingTarget", row.sourceMappingTarget);
    if (row.note !== undefined) {
      if (row.note === null) delete target.notes;
      else target.notes = row.note;
    }
    if (row.pixsoTarget !== undefined && row.pixsoTargetStatus === undefined) {
      target.pixsoTargetStatus = row.pixsoTarget === null ? "unregistered" : "registered";
    }
    if (target.pixsoTargetStatus === "registered" && row.mappingStatus === undefined && !target.mappingStatus) {
      target.mappingStatus = "mapped-pending-verification";
    }
  }
  if (target.pixsoTargetStatus === "registered") {
    if (!target.pixsoTarget) throw new Error(`${key}: registered target requires pixsoTarget.`);
    if (!facts.targetNames.has(target.pixsoTarget)) {
      throw new Error(`${key}: Pixso target is not an exact registered name: ${target.pixsoTarget}`);
    }
    if (!target.pixsoVariant || typeof target.pixsoVariant !== "object" || Array.isArray(target.pixsoVariant)) {
      throw new Error(`${key}: registered target requires pixsoVariant JSON object.`);
    }
  }
  if (target.pixsoTargetStatus === "unregistered" && target.pixsoTarget !== null) {
    throw new Error(`${key}: unregistered target must use pixsoTarget=—.`);
  }
  if (action === "add") {
    mappings.push(target);
    addChange(key, null, target);
  } else {
    mappings[index] = target;
    addChange(key, current, target);
  }
}

function applyToken(row, profile) {
  const mappingType = normalizeMappingType(row.mappingType);
  if (!mappingType) throw new Error(`Unknown token mappingType: ${row.mappingType || "(missing)"}`);
  if (row.action === "add") {
    if (mappingType === "tokenMappings") {
      const htmlCssVariable = row.htmlCssVariable || row.htmlIdentity;
      if (!htmlCssVariable || !row.pixsoVariables || !row.pixsoVariables.length) {
        throw new Error("Adding a token mapping requires htmlIdentity/htmlCssVariable and pixsoVariable(s).");
      }
      const target = {
        htmlCssVariable,
        htmlSourceToken: null,
        pixsoVariable: row.pixsoVariables[0],
        pixsoCollection: row.pixsoCollection ?? null,
        pixsoMode: row.pixsoMode ?? null,
        valueTransform: row.valueTransformOrComposition || "identity",
      };
      const existing = profile[mappingType].some((item) => item.htmlCssVariable === htmlCssVariable);
      if (existing) throw new Error(`Token mapping already exists: ${htmlCssVariable}`);
      profile[mappingType].push(target);
      addChange(`token:${profile.id}:${htmlCssVariable}`, null, target);
      return;
    }
    if (["semanticTokenMappings", "runtimeSemanticAliases"].includes(mappingType)) {
      if (!row.htmlIdentity || !row.pixsoVariables?.length) {
        throw new Error("Adding a semantic token requires htmlIdentity and pixsoVariable(s).");
      }
      const target = {
        role: row.htmlIdentity,
        htmlCssVariable: row.htmlCssVariable ?? null,
        htmlSourceToken: null,
        pixsoVariable: row.pixsoVariables[0],
        valueTransform: row.valueTransformOrComposition || "identity",
      };
      const mappings = profile[mappingType] || (profile[mappingType] = []);
      if (
        mappingType === "runtimeSemanticAliases" &&
        (profile.semanticTokenMappings || []).some((item) => item.role === target.role)
      ) {
        throw new Error(
          `Runtime role already inherits from semanticTokenMappings: ${target.role}; edit it with mappingType=semantic-token.`,
        );
      }
      const existing = mappings.some((item) => item.role === target.role);
      if (existing) throw new Error(`Semantic mapping already exists: ${target.role}`);
      mappings.push(target);
      addChange(`token:${profile.id}:${target.role}`, null, target);
      return;
    }
    if (mappingType === "semanticColorMappings") {
      if (!row.htmlIdentity || !row.pixsoVariables?.length || !row.valueTransformOrComposition) {
        throw new Error("Adding a semantic color requires htmlIdentity, pixsoVariable(s), and composition.");
      }
      const target = {
        role: row.htmlIdentity,
        htmlCssVariables: row.htmlCssVariable ? [row.htmlCssVariable] : [],
        pixsoVariables: row.pixsoVariables,
        composition: row.valueTransformOrComposition,
      };
      const existing = profile[mappingType].some((item) => item.role === target.role);
      if (existing) throw new Error(`Semantic color mapping already exists: ${target.role}`);
      profile[mappingType].push(target);
      addChange(`token:${profile.id}:${target.role}`, null, target);
      return;
    }
  }
  if (row.action !== "update") throw new Error(`Token mappings support action=update or action=add, not ${row.action || "(missing)"}.`);
  if (!profile[mappingType]) profile[mappingType] = [];
  const identityField = mappingType === "tokenMappings" ? "htmlCssVariable" : "role";
  const index = findMapping(profile[mappingType], row, identityField);
  const key = `token:${profile.id}:${row.htmlIdentity}`;
  if (seen.has(key)) throw new Error(`Duplicate pending edit: ${key}`);
  seen.add(key);
  if (
    mappingType === "runtimeSemanticAliases" &&
    (profile.semanticTokenMappings || []).some((item) => item.role === row.htmlIdentity)
  ) {
    throw new Error(
      `${key}: this role is inherited from semanticTokenMappings; edit it with mappingType=semantic-token.`,
    );
  }
  if (index < 0) throw new Error(`${key}: mapping does not exist; use action=add.`);
  const current = profile[mappingType][index];
  const target = { ...current };
  if (mappingType === "tokenMappings") {
    setOptional(target, "pixsoVariable", row.pixsoVariables?.[0]);
    setOptional(target, "pixsoCollection", row.pixsoCollection);
    setOptional(target, "pixsoMode", row.pixsoMode);
    setOptional(target, "valueTransform", row.valueTransformOrComposition);
  } else if (mappingType === "semanticColorMappings") {
    if (row.pixsoVariables !== undefined) target.pixsoVariables = row.pixsoVariables || [];
    if (row.htmlCssVariable !== undefined) target.htmlCssVariables = row.htmlCssVariable ? [row.htmlCssVariable] : [];
    setOptional(target, "composition", row.valueTransformOrComposition);
  } else {
    setOptional(target, "pixsoVariable", row.pixsoVariables?.[0]);
    setOptional(target, "htmlCssVariable", row.htmlCssVariable);
    setOptional(target, "valueTransform", row.valueTransformOrComposition);
  }
  addChange(key, current, target);
  profile[mappingType][index] = target;
}

for (const row of pendingRows) {
  try {
    const profile = profileFor(row);
    if (row.type === "component") {
      if (!row.htmlLogicalName) throw new Error("htmlLogicalName is required.");
      applyComponent(row, profile);
    } else if (row.type === "component-slot") {
      if (!row.htmlParent || !row.htmlSlot || !row.htmlRole) throw new Error("htmlParent, htmlSlot and htmlRole are required.");
      applyComponentSlot(row, profile);
    } else if (row.type === "endpoint-component") {
      if (!row.endpointComponentId || !row.contractId || !row.htmlLogicalName) {
        throw new Error("endpointComponentId, contractId and htmlLogicalName are required.");
      }
      applyEndpointComponent(row, profile);
    } else {
      applyToken(row, profile);
    }
  } catch (error) {
    errors.push(`line ${row.lineIndex + 1}: ${error.message}`);
  }
}

if (errors.length) {
  console.error("Obsidian mapping edits are invalid:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(`Obsidian mapping edits valid: ${pendingRows.length} pending row(s), ${changes.length} change(s).`);
for (const change of changes) {
  console.log(`- ${change.label}: ${describe(change.before)} -> ${describe(change.after)}`);
}

if (checkMode) {
  console.log("Check only; no registry or Obsidian note was changed.");
  process.exit(0);
}

for (const profile of nextRegistry.profiles || []) refreshProfileSummary(profile);

const preflightDir = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-mapping-preflight-"));
const preflightRegistry = path.join(preflightDir, "mapping-registry.json");
try {
  fs.writeFileSync(preflightRegistry, stable(nextRegistry));
  const validation = spawnSync(
    process.execPath,
    [path.join(skillRoot, "scripts/validate-mapping-registry.mjs"), "--registry", preflightRegistry],
    { cwd: skillRoot, encoding: "utf8" },
  );
  if (validation.status !== 0) {
    if (validation.stdout) process.stdout.write(validation.stdout);
    if (validation.stderr) process.stderr.write(validation.stderr);
    throw new Error("Registry preflight failed; no files were changed.");
  }
} finally {
  fs.rmSync(preflightDir, { recursive: true, force: true });
}

fs.writeFileSync(registryPath, stable(nextRegistry));
const nextHash = crypto.createHash("sha256").update(JSON.stringify(nextRegistry)).digest("hex");
const appliedText = markRowsApplied(noteText, pendingRows);
const noteWithHash = appliedText.replace(/^registryHash:\s*.*$/m, `registryHash: ${nextHash}`);
if (noteWithHash !== noteText) fs.writeFileSync(notePath, noteWithHash);
console.log(`Applied mapping edits to ${registryPath}.`);
console.log(`Marked applied rows in ${notePath}.`);
