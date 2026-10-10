#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadReadinessPolicy, resolveComponentReadiness } from "./component-readiness-policy.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const contextPath = valueFor("--context");
const bindingsPath = valueFor("--bindings") ?? valueFor("--page-spec");
const outputPath = valueFor("--out");
const manifestPath = valueFor("--manifest");
const layoutContractPath = valueFor("--layout-contract");
if (!contextPath || !bindingsPath || !outputPath || !manifestPath || !layoutContractPath) {
  console.error("Usage: generate-html-component-skeleton.mjs --context <context.json> --layout-contract <layout-contract.json> --bindings <bindings.json|page-spec.json> --out <component-skeleton.js> --manifest <component-usage.json>");
  process.exit(2);
}

const readJson = (file) => JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const context = readJson(contextPath);
const input = readJson(bindingsPath);
const layoutContract = readJson(layoutContractPath);
if (context.request?.framework !== "html" || context.renderer?.framework !== "html") throw new Error("Context Packet must contain the HTML renderer contract");
if (context.request?.confirmed !== true || context.request?.confirmation?.status !== "confirmed") throw new Error("Context Packet must be explicitly confirmed before component selection");
if (layoutContract.pattern !== context.layout?.id) throw new Error("layout-contract.pattern must equal context.layout.id");
if (JSON.stringify(layoutContract.paneOrder) !== JSON.stringify(context.layout?.paneOrder)) throw new Error("layout-contract.paneOrder must equal context.layout.paneOrder");
const rawBindings = input.componentBindings ?? input.components ?? input.bindings ?? [];
if (!Array.isArray(rawBindings) || rawBindings.length === 0) throw new Error("Bindings input must contain componentBindings, components, or bindings");
const rendererByLogicalName = new Map((context.renderer.components ?? []).map((item) => [item.logicalName, item]));
const readinessPolicy = loadReadinessPolicy(path.join(context.repository.root, "skill-support"));
const componentRegistry = readJson(path.join(context.repository.root, "packages/component-contracts/src/components.json")).components;
const registryByLogicalName = new Map(componentRegistry.map((component) => [component.logicalName, component]));
const normalized = rawBindings.map((binding, index) => {
  const resolved = rendererByLogicalName.get(binding.logicalName);
  if (!resolved?.rendererKey) throw new Error(`No HTML rendererKey resolved for binding ${index}: ${binding.logicalName}`);
  const readiness = resolveComponentReadiness(registryByLogicalName.get(binding.logicalName), readinessPolicy);
  if (!readiness.allowedInFastPreview) throw new Error(`${binding.logicalName}: component readiness is ${readiness.level}; ${readiness.reason}`);
  return {
    logicalName: binding.logicalName,
    rendererKey: resolved.rendererKey,
    usage: Array.isArray(binding.usage) ? binding.usage.join(", ") : binding.usage ?? binding.id ?? `binding-${index + 1}`,
    region: binding.region ?? binding.pane ?? null,
    options: binding.options ?? {},
    expectedRuntimeCount: binding.expectedRuntimeCount ?? binding.count ?? 1,
    tokenRoles: resolved.tokenRoles ?? [],
    supportedProps: resolved.supportedProps ?? [],
    supportedSlots: resolved.supportedSlots ?? [],
    source: resolved.source,
    readiness
  };
});
const grouped = new Map();
for (const binding of normalized) {
  const previous = grouped.get(binding.logicalName);
  if (previous) {
    previous.usage = `${previous.usage}; ${binding.usage}`;
    previous.expectedRuntimeCount += binding.expectedRuntimeCount;
    if (binding.region && !previous.regions.includes(binding.region)) previous.regions.push(binding.region);
  } else grouped.set(binding.logicalName, { ...binding, regions: binding.region ? [binding.region] : [] });
}
const registered = [...grouped.values()];
const identifier = (key) => key.replace(/-([a-z])/g, (_, character) => character.toUpperCase()).replace(/[^a-zA-Z0-9_$]/g, "_");
const lines = [
  'import "@text-to-ui/tokens";',
  'import "@text-to-ui/components-html/styles.css";',
  'import "@text-to-ui/components-html/pattern-shell.css";',
  'import { collectHtmlComponentEvidence, renderHtmlComponent } from "@text-to-ui/components-html";',
  '',
  'const node = (markup) => {',
  '  const template = document.createElement("template");',
  '  template.innerHTML = markup.trim();',
  '  return template.content.firstElementChild;',
  '};',
  ''
];
for (const entry of [...new Map(registered.map((item) => [item.rendererKey, item])).values()]) {
  lines.push(`export const render${identifier(entry.rendererKey)[0].toUpperCase()}${identifier(entry.rendererKey).slice(1)} = (options = {}) => node(renderHtmlComponent(${JSON.stringify(entry.rendererKey)}, options));`);
}
lines.push('', 'export { collectHtmlComponentEvidence };', '');
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(path.resolve(outputPath), `${lines.join("\n")}\n`);

const sourceRoot = path.relative(path.resolve(context.repository.root), path.dirname(path.resolve(outputPath))) || ".";
const manifestLayoutContractPath = path.relative(path.dirname(path.resolve(manifestPath)), path.resolve(layoutContractPath)) || path.basename(path.resolve(layoutContractPath));
const manifest = {
  $schema: path.relative(path.dirname(path.resolve(manifestPath)), path.join(context.repository.root, "skill-support/assets/design-system/component-usage.schema.json")),
  schemaVersion: 2,
  targetFramework: "html",
  enforcement: "strict-source",
  registry: "packages/component-contracts/src/components.json",
  sourceRoots: [...new Set([sourceRoot, ...(input.sourceRoots ?? [])])],
  renderer: {
    package: context.renderer.package,
    factoryImport: context.renderer.factoryImport,
    evidenceImport: context.renderer.evidenceImport,
    styleImports: context.renderer.styleImports
  },
  layout: {
    contractPath: manifestLayoutContractPath,
    pattern: layoutContract.pattern,
    paneOrder: layoutContract.paneOrder,
    patternDigest: context.patternContract?.patternDigest ?? null,
    structureDigest: context.patternContract?.structureDigest ?? null
  },
  registered: registered.map((entry) => ({
    logicalName: entry.logicalName,
    rendererKey: entry.rendererKey,
    usage: entry.usage,
    requiredCallSites: 1,
    expectedRuntimeCount: entry.expectedRuntimeCount,
    regions: entry.regions,
    supportedProps: entry.supportedProps,
    supportedSlots: entry.supportedSlots,
    tokenRoles: entry.tokenRoles,
    source: entry.source,
    readinessLevel: entry.readiness.level,
    unresolvedParity: entry.readiness.unresolvedDimensions
  })),
  contractBased: [],
  custom: [],
  previousOutputReuse: false,
  validationStage: "fast-preview"
};
fs.mkdirSync(path.dirname(path.resolve(manifestPath)), { recursive: true });
fs.writeFileSync(path.resolve(manifestPath), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, output: path.resolve(outputPath), manifest: path.resolve(manifestPath), componentCount: registered.length }, null, 2));
