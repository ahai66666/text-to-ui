#!/usr/bin/env node

/**
 * Runtime evidence gate.
 *
 * The older validators only proved that adapter files and token names existed.
 * This gate deliberately checks the evidence that can be verified without a
 * browser (registry parity, generated-source boundaries, inline SVG, and the
 * canonical field/icon rules).  It reports Partial coverage instead of
 * pretending that a generated adapter is a fully verified component.  Pass
 * --strict only in CI after browser evidence has been produced for every
 * component.
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFile(path.join(root, relative), "utf8");
const exists = async (relative) => Boolean(await fs.stat(path.join(root, relative)).catch(() => null));
const strict = process.argv.includes("--strict");
const failures = [];
const warnings = [];
const requiredDimensions = ["sourceReady", "contractReady", "visualParity", "behaviorParity", "accessibilityParity", "tokenParity"];
const frameworks = ["html", "react", "vue"];

const registry = JSON.parse(await read("packages/component-contracts/src/components.json"));
const manifest = JSON.parse(await read("packages/component-contracts/src/parity-manifest.json"));
const components = [...registry.components].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
const ids = new Set();
const orders = new Set();
for (const component of components) {
  if (ids.has(component.id)) failures.push(`duplicate component id: ${component.id}`);
  if (orders.has(component.order)) failures.push(`duplicate component order: ${component.order}`);
  ids.add(component.id);
  orders.add(component.order);
  if (!component.fixtureId || !component.canonicalSpecimen || !component.comparisonGroup) failures.push(`${component.id}: missing gallery comparison identity`);
  if (!component.canonicalSelector?.includes(`[data-fixture-id="${component.fixtureId}"]`)) failures.push(`${component.id}: canonical selector does not target its current gallery fixture`);
  if (!component.canonicalSpecimen?.startsWith("gallery:")) failures.push(`${component.id}: canonical specimen is not from the current gallery`);
  if (!component.specimens?.length) failures.push(`${component.id}: missing structural specimen`);
  for (const key of requiredDimensions) {
    if (typeof component.readiness?.[key] !== "boolean") failures.push(`${component.id}: missing readiness.${key}`);
  }
  const expectedStatus = requiredDimensions.every((key) => component.readiness[key]) ? "ready" : "partial";
  if (component.status !== expectedStatus) failures.push(`${component.id}: status is not derived from six dimensions`);
  if (["input", "search"].includes(component.id)) {
    if (component.allowedStates?.includes("selected")) failures.push(`${component.id}: selected is not a legal text-input state`);
    if (!component.allowedStates?.includes("filled")) failures.push(`${component.id}: filled state is missing`);
  }
  for (const framework of frameworks) {
    const adapter = component.frameworks?.[framework];
    if (!adapter?.source) failures.push(`${component.id}: missing ${framework} adapter source`);
    if (adapter?.status !== component.status) failures.push(`${component.id}: ${framework} status drift`);
  }
}

if (manifest.componentCount !== components.length) failures.push(`parity manifest count ${manifest.componentCount} != registry count ${components.length}`);
if (manifest.components?.length !== components.length) failures.push("parity manifest component list is incomplete");
const manifestIds = new Set((manifest.components ?? []).map((component) => component.id));
for (const id of ids) if (!manifestIds.has(id)) failures.push(`parity manifest missing ${id}`);

const sourceFiles = [
  "packages/components-html/src/generated/index.js",
  "packages/components-react/src/generated/index.jsx",
  "packages/components-vue/src/generated/index.js",
  "apps/component-gallery/runtime-html.js",
  "apps/component-gallery/runtime-react.jsx",
  "apps/component-gallery/runtime-vue.js",
  "apps/component-gallery/runtime-file-fallback.js"
];
const sourceContents = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, await read(file)])));
const sourceText = Object.entries(sourceContents).map(([file, content]) => `${file}\n${content}`).join("\n");
if (/<use\b/i.test(sourceText)) failures.push("runtime output still contains external SVG <use>; use inline SVG only");
if (/harmonyos-icons\.svg|new URL\([^)]*harmonyos-icons/i.test(sourceText)) failures.push("runtime output still depends on an external SVG sprite");
if (/navigation\/(?:share|settings)\b/.test(sourceText)) failures.push("runtime output uses an unregistered navigation icon alias");
for (const file of ["apps/component-gallery/runtime-react.jsx", "apps/component-gallery/runtime-vue.js"]) {
  if (sourceContents[file].includes("innerHTML")) failures.push(`${file} must not inject HTML`);
}
for (const required of ["data-contract-id", "data-category", "data-order", "data-fixture-id"]) {
  if (!sourceContents["apps/component-gallery/runtime-file-fallback.js"].includes(required)) failures.push(`file fallback missing ${required}`);
}

const iconMapText = await read("packages/components-html/src/icon-map.js");
for (const [size, width] of [[16, 1], [20, 1.25], [24, 1.5]]) {
  if (!iconMapText.includes(`${size}: ${width}`)) failures.push(`icon stroke rule missing: ${size}px -> ${width}px`);
}
const styleText = await read("packages/component-styles/src/index.css");
if (!styleText.includes('data-surface="gray"]:hover')) failures.push("gray Input/Search hover selector missing");
if (!styleText.includes("border: 2px solid var(--color-input-hover-border-on-subtle); padding-inline: 11px")) failures.push("gray Input/Search hover compensation missing");
if (!styleText.includes("linear-gradient(var(--color-input-hover-bg-on-subtle-layer)")) failures.push("gray Input/Search hover layer missing");
if (/\.tui-(?:input|search)(?::focus(?:-within)?|\[data-state=\"focus\"\])\s*\{[^}]*outline\s*:/s.test(styleText)) failures.push("Input/Search must not use an outer focus outline");
for (const role of ["body-l", "body-m", "body-s", "title-s", "subtitle-s"]) if (!styleText.includes(`data-typography-role=\"${role}\"`)) failures.push(`typography role selector missing: ${role}`);
const generatorText = await read("tools/generate-full-component-adapters.mjs");
if (generatorText.includes('?? "navigation/grid"') || generatorText.includes("?? 'navigation/grid'")) failures.push("generated adapters must not silently fall back to navigation/grid icons");

const generatedIds = components.filter((component) => Object.values(component.frameworks ?? {}).some((adapter) => adapter.source?.includes("/generated/"))).map((component) => component.id);
if (generatedIds.length) warnings.push(`${generatedIds.length} components still use generated adapters and remain Partial: ${generatedIds.join(", ")}`);
const readyCount = components.filter((component) => component.status === "ready").length;
const partialCount = components.length - readyCount;
if (strict && partialCount > 0) failures.push(`strict runtime evidence requested but ${partialCount} components remain Partial`);

const result = {
  ok: failures.length === 0,
  strict,
  registered: components.length,
  categories: new Set(components.map((component) => component.category)).size,
  ready: readyCount,
  partial: partialCount,
  generatedAdapters: generatedIds.length,
  warnings,
  failures
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
