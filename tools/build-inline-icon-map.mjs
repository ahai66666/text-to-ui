#!/usr/bin/env node

/** Build one deterministic inline-SVG icon module for all three adapters. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "packages/components-html/src/component-icons.svg");
const xml = await fs.readFile(source, "utf8");
const aliasRegistry = JSON.parse(await fs.readFile(
  path.join(root, "skill-support/assets/icons/icon-aliases.json"),
  "utf8"
));
// Symbol ids flatten the semantic path (for example
// `primary-level/mail` becomes `tui-primary-level-mail`). Do not recover the
// alias by splitting on the first hyphen: that turns the group into
// `primary/level-mail` and makes valid component calls fail at runtime.
const canonicalAliasBySymbolId = new Map(
  Object.keys(aliasRegistry.aliases ?? {})
    .map((alias) => [`tui-${alias.replaceAll("/", "-")}`, alias])
);
const iconMetadataByAlias = new Map(Object.entries(aliasRegistry.aliases ?? {}).map(([alias, definition]) => [alias, {
  source: definition.source === "lucide" ? `lucide@${aliasRegistry.lucideVersion}` : definition.source,
  ...(definition.name ? { name: definition.name } : {}),
  ...(definition.path ? { path: definition.path } : {})
}]));
const definitions = {};
for (const match of xml.matchAll(/<symbol\s+id="tui-([^"]+)"(?:\s+data-icon-alias="([^"]+)")?\s+[^>]*viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)) {
  const [, id, semanticAlias, viewBox, content] = match;
  const [group, ...parts] = id.split("-");
  const symbolId = `tui-${id}`;
  const alias = semanticAlias ?? canonicalAliasBySymbolId.get(symbolId) ?? `${group}/${parts.join("-")}`;
  const provenance = iconMetadataByAlias.get(alias);
  if (!provenance) throw new Error(`Icon sprite contains alias absent from the canonical registry: ${alias}`);
  // HarmonyOS icons expose one canonical Regular style only. Some supplied
  // assets intentionally carry their own paint (for example the white
  // checkbox mark with a subtle translucent edge), so preserve those values.
  const preservePaint = /(?:fill|stroke)="(?!none|currentColor)[^"]+"/.test(content);
  definitions[alias] = { viewBox, content: content.trim(), ...provenance, ...(preservePaint ? { preservePaint: true } : {}) };
}
if (!Object.keys(definitions).length) throw new Error("No icons found in the canonical sprite");

// Direct source-name lookup is useful for icons that are available in the
// bundled sprite but have not yet received a semantic alias. Only unique
// names/suffixes are accepted so an unknown request can never silently pick a
// conflicting glyph.
const normalizeIconLookup = (value) => String(value ?? "")
  .trim()
  .replace(/^lucide(?::|\/)/i, "")
  .replace(/([a-z])([A-Z])/g, "$1-$2")
  .replace(/[\s_]+/g, "-")
  .toLowerCase();
const uniqueLookup = (entries, equivalent = () => false) => {
  const map = new Map();
  const ambiguous = new Set();
  for (const [key, alias] of entries) {
    if (!key || ambiguous.has(key)) continue;
    if (map.has(key) && map.get(key) !== alias && !equivalent(map.get(key), alias)) {
      map.delete(key);
      ambiguous.add(key);
    } else map.set(key, alias);
  }
  return Object.fromEntries(map);
};
const flatAliasAliases = uniqueLookup(Object.keys(definitions)
  .map((alias) => [normalizeIconLookup(alias.replaceAll("/", "-")), alias]));
// These are compatibility spellings emitted by older page fixtures and by
// generic model output. They are intentionally runtime-only: canonical
// design-system references should continue to use the semantic aliases above.
const compatibilityAliasNames = {
  "disclosure-down": "navigation/chevron-down",
  "disclosure-right": "navigation/chevron-right",
  "disclosure-up": "navigation/chevron-up",
  "window-minimize": "window/minimize",
  "window-maximize": "window/maximize",
  "window-close": "window/close",
  close: "action/close",
  trash: "action/delete",
  document: "object/file",
  download: "action/download",
  refresh: "action/refresh",
  add: "action/add",
  settings: "action/settings",
  search: "field/search",
  more: "action/more",
  grid: "navigation/grid",
  history: "navigation/recent",
  user: "object/avatar",
  "panel-left": "navigation/panel-left",
  device: "object/device",
  calendar: "field/calendar",
  clock: "field/clock",
  info: "status/info",
  success: "status/success",
  warning: "status/warning",
  danger: "status/danger",
  neutral: "status/neutral",
  sync: "action/refresh"
};
const compatibilityAliases = Object.fromEntries(Object.entries(compatibilityAliasNames)
  .filter(([, alias]) => Object.hasOwn(definitions, alias))
  .map(([name, alias]) => [normalizeIconLookup(name), alias]));
const sourceNameAliases = uniqueLookup(Object.entries(definitions)
  .filter(([, definition]) => definition.name)
  .map(([alias, definition]) => [normalizeIconLookup(definition.name), alias]), (left, right) => definitions[left]?.content === definitions[right]?.content);
const semanticSuffixAliases = uniqueLookup(Object.keys(definitions)
  .map((alias) => [normalizeIconLookup(alias.split("/").at(-1)), alias]));

const moduleSource = `// Generated from packages/components-html/src/component-icons.svg. Do not edit by hand.\n` +
  `export const iconDefinitions = ${JSON.stringify(definitions, null, 2)};\n` +
  `const flatAliasAliases = Object.freeze(${JSON.stringify(flatAliasAliases)});\n` +
  `const compatibilityAliases = Object.freeze(${JSON.stringify(compatibilityAliases)});\n` +
  `const sourceNameAliases = Object.freeze(${JSON.stringify(sourceNameAliases)});\n` +
  `const semanticSuffixAliases = Object.freeze(${JSON.stringify(semanticSuffixAliases)});\n` +
  `const unresolvedIconDefinition = Object.freeze({ viewBox: "0 0 24 24", content: "<circle cx=\\"12\\" cy=\\"12\\" r=\\"9\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"/><path d=\\"M12 8v5\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"/><path d=\\"M12 16h.01\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"/>", source: "unresolved-fallback", name: "unresolved", manualFallback: true });\n` +
  `export const iconSizes = Object.freeze({16: 16, 20: 20, 24: 24});\n` +
  `export const iconStrokeWidths = Object.freeze({16: 1, 20: 1.25, 24: 1.5});\n` +
  `const escapeAttribute = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");\n` +
  `const normalizeLookup = (value) => String(value ?? "").trim().replace(/^lucide(?::|\\/)/i, "").replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\\s_]+/g, "-").toLowerCase();\n` +
  `export function resolveIcon(name) {\n` +
  `  const requestedAlias = String(name ?? "").trim();\n` +
  `  const exact = iconDefinitions[requestedAlias];\n` +
  `  if (exact) return { ...exact, resolvedAlias: requestedAlias, resolution: "canonical", requestedAlias };\n` +
  `  const normalized = normalizeLookup(requestedAlias);\n` +
  `  const flatAlias = flatAliasAliases[normalized];\n` +
  `  if (flatAlias && iconDefinitions[flatAlias]) return { ...iconDefinitions[flatAlias], resolvedAlias: flatAlias, resolution: "flat-alias", requestedAlias };\n` +
  `  const compatibilityAlias = compatibilityAliases[normalized];\n` +
  `  if (compatibilityAlias && iconDefinitions[compatibilityAlias]) return { ...iconDefinitions[compatibilityAlias], resolvedAlias: compatibilityAlias, resolution: "compatibility-alias", requestedAlias };\n` +
  `  const sourceAlias = sourceNameAliases[normalized];\n` +
  `  if (sourceAlias && iconDefinitions[sourceAlias]) return { ...iconDefinitions[sourceAlias], resolvedAlias: sourceAlias, resolution: "source-name", requestedAlias };\n` +
  `  const suffixAlias = semanticSuffixAliases[normalized.split("/").at(-1)];\n` +
  `  if (suffixAlias && iconDefinitions[suffixAlias]) return { ...iconDefinitions[suffixAlias], resolvedAlias: suffixAlias, resolution: "semantic-suffix", requestedAlias };\n` +
  `  return { ...unresolvedIconDefinition, resolvedAlias: null, resolution: "unresolved-fallback", requestedAlias };\n` +
  `}\n` +
  `export function iconMarkup(name, { size = 20, decorative = true, ariaLabel = \"\" } = {}) {\n` +
  `  if (![16, 20, 24].includes(Number(size))) throw new Error(\`Unsupported icon display size: \${size}\`);\n` +
  `  const definition = resolveIcon(name);\n` +
  `  const label = decorative ? \" aria-hidden=\\\"true\\\"\" : \` role=\\\"img\\\" aria-label=\\\"\${String(ariaLabel).replaceAll(\"\\\"\", \"&quot;\")}\\\"\`;\n` +
  `  return \`<svg class=\\\"tui-icon tui-icon--regular\\\" viewBox=\\\"\${definition.viewBox}\\\" width=\\\"\${size}\\\" height=\\\"\${size}\\\" data-icon-alias=\\\"\${name}\\\" data-icon-size=\\\"\${size}\\\" data-display-size-token=\\\"size/\${size}\\\" data-icon-kind=\\\"regular\\\" data-icon-source=\\\"\${definition.source}\\\"\${label}>\${definition.content}</svg>\`;\n` +
`}\n`;

const runtimeModuleSource = moduleSource
  .replace('export function iconMarkup(name, { size = 20, decorative = true, ariaLabel = "" } = {}) {', 'export function iconMarkup(name, { size = 20, decorative = true, ariaLabel = "", iconStyle = "regular" } = {}) {')
  .replace('  if (![16, 20, 24].includes(Number(size)))', '  if (!["regular", "solid"].includes(iconStyle)) throw new Error(`Unsupported icon style: ${iconStyle}`);\n  if (![16, 20, 24].includes(Number(size)))')
  .replace('tui-icon tui-icon--regular', 'tui-icon tui-icon--${iconStyle}')
  .replace('data-icon-kind=\\"regular\\"', 'data-icon-kind=\\"${iconStyle}\\"');

for (const target of [
  "packages/components-html/src/icon-map.js",
  "packages/components-react/src/icon-map.js",
  "packages/components-vue/src/icon-map.js"
]) {
  await fs.writeFile(path.join(root, target), runtimeModuleSource);
}
console.log(`Built inline icon map with ${Object.keys(definitions).length} semantic aliases.`);
