#!/usr/bin/env node

import fs from "node:fs";
import { output as runtimeMap } from "./build-token-runtime-map.mjs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const tokenDir = path.join(skillDir, "assets", "design-system");
const outputPath = path.join(tokenDir, "dual-output-token-map.json");
const pixsoPath = path.join(tokenDir, "pixso-variables.json");
const colorPath = path.join(tokenDir, "tokens.colors.json");
const cssFiles = [
  "tokens.colors.css",
  "tokens.spacing.css",
  "tokens.size.css",
  "tokens.radius.css",
  "tokens.layout.css",
  "tokens.typography.css",
  "tokens.icon.css",
];

const mode = process.argv.includes("--write")
  ? "write"
  : process.argv.includes("--check")
    ? "check"
    : "print";

const pixsoManifest = JSON.parse(fs.readFileSync(pixsoPath, "utf8"));

const colorTokens = JSON.parse(fs.readFileSync(colorPath, "utf8"));
const cssSource = cssFiles
  .map((filename) => fs.readFileSync(path.join(tokenDir, filename), "utf8"))
  .join("\n");

function parseCssVariables(source) {
  const variables = new Map();
  const declaration = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;
  while ((match = declaration.exec(source))) {
    variables.set(match[1], match[2].trim());
  }
  return variables;
}

const cssVariables = parseCssVariables(cssSource);

function normalizeColor(value) {
  if (value === "transparent") return "#00000000";
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) return null;
  return (value.length === 7 ? `${value}FF` : value).toUpperCase();
}

function normalizeNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^-?\d+(\.\d+)?(px)?$/.test(value)) {
    return Number.parseFloat(value);
  }
  return null;
}

function resolveCssVariable(name, trail = []) {
  if (trail.includes(name)) {
    throw new Error(`Circular CSS variable reference: ${[...trail, name].join(" -> ")}`);
  }
  const raw = cssVariables.get(name);
  if (raw == null) throw new Error(`Missing CSS variable: ${name}`);
  const exactReference = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (exactReference) return resolveCssVariable(exactReference[1], [...trail, name]);
  return raw;
}

function getAtPath(root, tokenPath) {
  let value = root;
  for (const segment of tokenPath.split(".")) {
    if (value == null || typeof value !== "object" || !(segment in value)) return undefined;
    value = value[segment];
  }
  return value;
}

function resolveColorToken(tokenPath, trail = []) {
  if (trail.includes(tokenPath)) {
    throw new Error(`Circular color token reference: ${[...trail, tokenPath].join(" -> ")}`);
  }
  if (tokenPath === "transparent") {
    return { primitive: null, value: "#00000000", literal: "transparent" };
  }
  const direct = getAtPath(colorTokens, tokenPath);
  const semantic = getAtPath(colorTokens.semantic, tokenPath);
  const candidate = direct === undefined ? semantic : direct;
  if (candidate === undefined) throw new Error(`Unresolved color token: ${tokenPath}`);
  if (typeof candidate !== "string") {
    throw new Error(`Expected scalar color token at ${tokenPath}`);
  }
  const literal = normalizeColor(candidate);
  if (literal) return { primitive: tokenPath, value: literal };
  return resolveColorToken(candidate, [...trail, tokenPath]);
}

function flattenColorPrimitives() {
  const result = [];
  const visit = (value, segments) => {
    for (const [key, entry] of Object.entries(value)) {
      const next = [...segments, key];
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        visit(entry, next);
      } else {
        const token = next.join(".");
        result.push({
          sourceToken: `tokens.colors.json:${token}`,
          webCssVariable: `--color-${next.join("-")}`,
          pixsoVariable: next.join("/"),
          type: "color",
          resolvedValue: normalizeColor(entry),
        });
      }
    }
  };
  for (const family of ["brand", "neutral-dark", "neutral-light", "function", "multi"]) {
    visit(colorTokens[family], [family]);
  }
  return result;
}

function cssNameForSource(source) {
  const [file, tokenPath] = source.split(":");
  const segments = tokenPath.split(".");
  if (file === "tokens.colors.json" && segments[0] === "semantic") {
    const name = segments.slice(1).join("-");
    return `--${name.startsWith("state-") ? name : `state-${name}`}`;
  }
  if (file === "tokens.spacing.json") {
    return `--${segments[0] === "space" ? "space" : segments[0]}-${segments.slice(1).join("-")}`;
  }
  if (file === "tokens.size.json") {
    const [group, ...rest] = segments;
    const key = rest.join("-");
    if (group === "size") return `--size-${key}`;
    if (group === "icon") return `--icon-size-${key}`;
    if (group === "indicator") {
      const rewrites = {
        "badge-height": "height-badge",
        "progress-height": "height-progress",
        "avatar-sm-size": "size-avatar-sm",
        "avatar-md-size": "size-avatar-md",
      };
      return `--${rewrites[key] ?? key}`;
    }
    if (group === "component") {
      if (key.endsWith("-min-height")) {
        return `--min-height-${key.slice(0, -"-min-height".length)}`;
      }
      if (key.endsWith("-height")) {
        return `--height-${key.slice(0, -"-height".length)}`;
      }
      if (key.endsWith("-width")) {
        return `--width-${key.slice(0, -"-width".length)}`;
      }
      if (key.endsWith("-size")) {
        return `--size-${key.slice(0, -"-size".length)}`;
      }
    }
    if (group === "modal") {
      const rewrites = {
        "width-s": "width-modal-sm",
        "width-m": "width-modal-md",
        "width-l": "width-modal-lg",
        "dialog-width": "width-dialog",
      };
      return `--${rewrites[key]}`;
    }
  }
  if (file === "tokens.radius.json") {
    return `--radius-${segments.slice(1).join("-")}`;
  }
  if (file === "tokens.layout.json") {
    const group = ["spacing", "shell"].includes(segments[0]) ? "" : `${segments[0]}-`;
    return `--layout-${group}${segments.slice(1).join("-")}`;
  }
  if (file === "tokens.typography.json") {
    const [group, ...rest] = segments;
    if (group === "font-family") return "--font-sans";
    return `--${group}-${rest.join("-")}`;
  }
  if (file === "tokens.icon.json" && segments[0] === "lucide" && segments[1] === "project-stroke-width-by-display-size") {
    return `--icon-outline-stroke-width-${segments.at(-1)}`;
  }
  throw new Error(`No Web CSS mapping rule for ${source}`);
}

function webContractPathForSource(source) {
  const [file, tokenPath] = source.split(":");
  if (file !== "tokens.layout.json") return null;
  return `page-spec.json:${tokenPath}`;
}

function validateResolvedValue(mapping, pixsoValue) {
  const cssValue = resolveCssVariable(mapping.webCssVariable);
  if (mapping.type === "color") {
    const normalized = normalizeColor(cssValue);
    if (normalized !== normalizeColor(pixsoValue)) {
      throw new Error(
        `${mapping.webCssVariable} resolves to ${cssValue}, expected ${pixsoValue} for ${mapping.pixsoVariable}`,
      );
    }
    return;
  }
  if (mapping.type === "number") {
    const normalized = normalizeNumber(cssValue);
    if (normalized !== normalizeNumber(pixsoValue)) {
      throw new Error(
        `${mapping.webCssVariable} resolves to ${cssValue}, expected ${pixsoValue} for ${mapping.pixsoVariable}`,
      );
    }
    return;
  }
  if (
    mapping.pixsoVariable === "font/family/sans"
      ? !cssValue.includes(String(pixsoValue))
      : cssValue !== String(pixsoValue)
  ) {
    throw new Error(
      `${mapping.webCssVariable} resolves to ${cssValue}, expected ${pixsoValue} for ${mapping.pixsoVariable}`,
    );
  }
}

const primitiveColorMappings = flattenColorPrimitives();
const manifestVariables = Object.values(pixsoManifest.collections).flatMap((collection) =>
  Object.entries(collection.variables).map(([pixsoVariable, definition]) => ({
    collection: collection.name,
    pixsoVariable,
    definition,
  })),
);

const variableMappings = manifestVariables.map(({ collection, pixsoVariable, definition }) => {
  const sourceToken =
    collection === "Color"
      ? `tokens.colors.json:${pixsoVariable.replaceAll("/", ".")}`
      : definition.source;
  let webCssVariable =
    definition.cssVariable ??
    (collection === "Color"
      ? `--color-${pixsoVariable.replaceAll("/", "-")}`
      : cssNameForSource(definition.source));
  if (!cssVariables.has(webCssVariable) && definition.type === "string") {
    webCssVariable = null;
  }
  const mapping = {
    sourceToken,
    webCssVariable,
    webContractPath: webCssVariable ? null : webContractPathForSource(definition.source),
    pixsoVariable,
    collection,
    type: definition.type,
    resolvedValue: definition.webValue ?? definition.value,
    pixsoValue: definition.value,
    valueTransform: definition.valueTransform ?? "identity",
  };
  if (mapping.webCssVariable) {
    validateResolvedValue(mapping, definition.webValue ?? definition.value);
  }
  return mapping;
});

const primitiveSourceByPixso = new Map(
  runtimeMap.mappings.map((entry) => [entry.pixsoVariable, entry.sourceToken]),
);
const semanticByCssVariable = new Map();
for (const [role, definition] of Object.entries(runtimeMap.semanticRoles)) {
  const candidate = {
    role,
    sourceToken: definition.sourceToken,
    webCssVariable: definition.cssVariable,
    pixsoVariable: definition.pixsoVariable,
    resolvedCssValue: definition.resolvedCssValue,
    pixsoValue: definition.pixsoValue,
    valueTransform: definition.valueTransform ?? "identity",
  };
  const current = semanticByCssVariable.get(candidate.webCssVariable);
  const candidateIsSemanticSource =
    candidate.sourceToken !== primitiveSourceByPixso.get(candidate.pixsoVariable);
  const currentIsSemanticSource =
    current &&
    current.sourceToken !== primitiveSourceByPixso.get(current.pixsoVariable);
  if (!current || (candidateIsSemanticSource && !currentIsSemanticSource)) {
    semanticByCssVariable.set(candidate.webCssVariable, candidate);
  }
}
const semanticTokenMappings = [...semanticByCssVariable.values()];

const primitiveByPixsoName = new Map(
  primitiveColorMappings.map((entry) => [entry.pixsoVariable, entry]),
);
for (const entry of primitiveColorMappings) {
  const manifestEntry = primitiveByPixsoName.get(entry.pixsoVariable);
  if (!manifestEntry || !cssVariables.has(entry.webCssVariable)) {
    throw new Error(`Incomplete primitive color mapping for ${entry.sourceToken}`);
  }
  validateResolvedValue(entry, entry.resolvedValue);
}

const semanticColorMappings = [];
for (const [name, raw] of Object.entries(colorTokens.semantic)) {
  if (typeof raw === "number") continue;
  const semanticCssName = name.startsWith("state-") ? `--${name}` : `--color-${name}`;
  if (typeof raw === "string") {
    const resolved = resolveColorToken(raw);
    const webCssVariable = semanticCssName;
    const cssResolved = normalizeColor(resolveCssVariable(webCssVariable));
    if (cssResolved !== resolved.value) {
      throw new Error(
        `${webCssVariable} resolves to ${cssResolved}, expected ${resolved.value} from ${raw}`,
      );
    }
    semanticColorMappings.push({
      role: name,
      sourceToken: `tokens.colors.json:semantic.${name}`,
      composition: "single",
      webCssVariables: [webCssVariable],
      pixsoVariables: resolved.primitive ? [resolved.primitive.replaceAll(".", "/")] : [],
      literal: resolved.literal,
      resolvedValues: [resolved.value],
    });
    continue;
  }
  if (raw && typeof raw === "object" && raw.base && raw.overlay) {
    const base = resolveColorToken(raw.base);
    const overlay = resolveColorToken(raw.overlay);
    const webCssVariables = [semanticCssName, `${semanticCssName}-layer`];
    const cssResolved = webCssVariables.map((variable) =>
      normalizeColor(resolveCssVariable(variable)),
    );
    const expected = [base.value, overlay.value];
    if (cssResolved.some((value, index) => value !== expected[index])) {
      throw new Error(
        `${name} composite CSS bindings ${cssResolved.join(", ")} do not match ${expected.join(", ")}`,
      );
    }
    semanticColorMappings.push({
      role: name,
      sourceToken: `tokens.colors.json:semantic.${name}`,
      composition: "layered",
      webCssVariables,
      pixsoVariables: [base, overlay]
        .map((entry) => entry.primitive?.replaceAll(".", "/"))
        .filter(Boolean),
      resolvedValues: expected,
    });
    continue;
  }
  throw new Error(`Unsupported semantic color token: ${name}`);
}

export const output = {
  schemaVersion: 1,
  generatedFrom: [
    "assets/design-system/tokens.*.json",
    "assets/design-system/tokens.*.css",
    "assets/design-system/pixso-variables.json",
    "assets/design-system/token-runtime-map.json",
  ],
  rules: {
    sourceOfTruth: "tokens.*.json",
    webRendering: "CSS custom properties",
    pixsoRendering: "local variable bindings",
    primitiveColorVariableCount: 56,
    semanticPixsoVariables: false,
    semanticColorPolicy:
      "Resolve semantic Web aliases to the same core Pixso variable; layered semantics bind one variable per paint layer.",
    hardcodedPageColors: false,
  },
  summary: {
    mappedPixsoVariables: variableMappings.length,
    primitiveColors: primitiveColorMappings.length,
    semanticColors: semanticColorMappings.length,
    semanticTokenMappings: semanticTokenMappings.length,
  },
  variableMappings,
  semanticTokenMappings,
  semanticColorMappings,
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
if (mode === "write") {
  fs.writeFileSync(outputPath, serialized);
  console.log(`Wrote ${outputPath}`);
} else if (mode === "check") {
  if (!fs.existsSync(outputPath)) {
    console.error(`Missing ${outputPath}; run with --write`);
    process.exit(1);
  }
  const current = fs.readFileSync(outputPath, "utf8");
  if (current !== serialized) {
    console.error(`${outputPath} is stale; run with --write`);
    process.exit(1);
  }
  console.log(
    `Dual-output token map valid: ${variableMappings.length} Pixso variables, ` +
      `${primitiveColorMappings.length} core colors, ${semanticTokenMappings.length} semantic mappings, ` +
      `${semanticColorMappings.length} semantic colors.`,
  );
} else {
  process.stdout.write(serialized);
}

}
