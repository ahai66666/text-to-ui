#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const tokenDir = path.join(skillDir, "assets", "design-system");
const runtimePath = path.join(tokenDir, "token-runtime-map.json");
const mapPath = path.join(tokenDir, "token-utility-map.json");
const cssPath = path.join(tokenDir, "tokens.utility.css");
const runtime = JSON.parse(fs.readFileSync(runtimePath, "utf8"));
const mode = process.argv.includes("--check") ? "check" : "write";

function slug(value) {
  return String(value)
    .replaceAll("/", "-")
    .replaceAll(".", "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function cssClass(value) {
  return `.${value}`;
}

const utilities = [];
const rules = [];
const seen = new Set();

function addUtility(className, cssProperty, mapping, property) {
  if (seen.has(className)) throw new Error(`Duplicate utility class: ${className}`);
  seen.add(className);
  utilities.push({
    className,
    property,
    cssProperty,
    pixsoVariable: mapping.pixsoVariable,
    cssVariable: mapping.cssVariable,
    resolvedCssValue: mapping.resolvedCssValue,
  });
  rules.push(`${cssClass(className)} { ${cssProperty}: var(${mapping.cssVariable}); }`);
}

for (const mapping of runtime.mappings) {
  const token = slug(mapping.pixsoVariable);
  if (mapping.pixsoCollection === "Color") {
    addUtility(`u-bg-${token}`, "background-color", mapping, "fills");
    addUtility(`u-text-${token}`, "color", mapping, "fills");
    addUtility(`u-stroke-${token}`, "stroke", mapping, "strokes");
    continue;
  }

  if (mapping.pixsoCollection === "Spacing") {
    const spacing = [
      ["gap", "gap"],
      ["p", "padding"], ["px", "padding-inline"], ["py", "padding-block"],
      ["pt", "padding-top"], ["pr", "padding-right"],
      ["pb", "padding-bottom"], ["pl", "padding-left"],
      ["m", "margin"], ["mx", "margin-inline"], ["my", "margin-block"],
      ["mt", "margin-top"], ["mr", "margin-right"],
      ["mb", "margin-bottom"], ["ml", "margin-left"],
    ];
    for (const [prefix, cssProperty] of spacing) {
      addUtility(`u-${prefix}-${token}`, cssProperty, mapping, cssProperty);
    }
    continue;
  }

  if (mapping.pixsoCollection === "Size & Layout") {
    const [group, ...rest] = mapping.pixsoVariable.split("/");
    const value = slug(rest.join("-"));
    if (group === "radius") {
      addUtility(`u-radius-${value}`, "border-radius", mapping, "borderRadius");
    } else if (group === "opacity") {
      addUtility(`u-opacity-${value}`, "opacity", mapping, "opacity");
    } else if (group === "layout" && rest[0] === "width") {
      addUtility(`u-w-${token}`, "width", mapping, "width");
    } else if (group === "layout" && rest[0] === "height") {
      addUtility(`u-h-${token}`, "height", mapping, "height");
    } else if (group === "size") {
      addUtility(`u-w-${token}`, "width", mapping, "width");
      addUtility(`u-h-${token}`, "height", mapping, "height");
    }
    continue;
  }

  if (mapping.pixsoCollection === "Typography") {
    const [group, ...rest] = mapping.pixsoVariable.split("/");
    if (group !== "font") continue;
    if (rest[0] === "size") addUtility(`u-font-size-${slug(rest.slice(1).join("-"))}`, "font-size", mapping, "fontSize");
    if (rest[0] === "line-height") addUtility(`u-leading-${slug(rest.slice(1).join("-"))}`, "line-height", mapping, "lineHeight");
    if (rest[0] === "weight") addUtility(`u-font-weight-${slug(rest.slice(1).join("-"))}`, "font-weight", mapping, "fontWeight");
  }
}

const typeGroups = new Map();
for (const [role, mapping] of Object.entries(runtime.semanticRoles)) {
  const parts = role.split("/");
  if (parts[0] !== "typography" || parts.length !== 3) continue;
  const style = parts[1];
  const group = typeGroups.get(style) ?? {};
  group[parts[2]] = mapping;
  typeGroups.set(style, group);
}

const semanticTypes = [];
for (const [style, group] of typeGroups) {
  if (!group["font-size"] || !group["line-height"] || !group["font-weight"]) continue;
  const className = `u-type-${slug(style)}`;
  if (seen.has(className)) throw new Error(`Duplicate semantic utility class: ${className}`);
  seen.add(className);
  const variables = {
    fontSize: group["font-size"].cssVariable,
    lineHeight: group["line-height"].cssVariable,
    fontWeight: group["font-weight"].cssVariable,
  };
  semanticTypes.push({
    className,
    role: `typography/${style}`,
    property: "typography",
    pixsoVariables: [
      group["font-size"].pixsoVariable,
      group["line-height"].pixsoVariable,
      group["font-weight"].pixsoVariable,
    ],
    cssVariables: variables,
  });
  rules.push(`${cssClass(className)} { font-family: var(--font-sans); font-size: var(${variables.fontSize}); line-height: var(${variables.lineHeight}); font-weight: var(${variables.fontWeight}); }`);
}

const output = {
  schemaVersion: 1,
  source: "assets/design-system/token-runtime-map.json",
  classPrefix: "u-",
  policy: {
    classesAreCssUtilities: true,
    pixsoBindingRequiresDataPxKey: true,
    arbitraryValuesForbidden: true,
    pixsoMarkerAttribute: "data-px-key",
    pixsoMarkerIdPrefix: "px-key:",
  },
  utilities,
  semanticTypes,
};
const mapSerialized = `${JSON.stringify(output, null, 2)}\n`;
const cssSerialized = [
  "/* Generated by scripts/build-token-utility-map.mjs. Do not edit by hand. */",
  "/* Tailwind-like classes are CSS output helpers; Pixso binding still uses data-px-key. */",
  "",
  "@layer text-to-ui-utilities {",
  ...rules,
  "}",
  "",
].join("\n");

if (mode === "check") {
  if (!fs.existsSync(mapPath) || fs.readFileSync(mapPath, "utf8") !== mapSerialized) {
    console.error(`Stale or missing: ${mapPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(cssPath) || fs.readFileSync(cssPath, "utf8") !== cssSerialized) {
    console.error(`Stale or missing: ${cssPath}`);
    process.exit(1);
  }
  console.log(`Token utility map current: ${utilities.length} primitive utilities, ${semanticTypes.length} typography utilities.`);
} else {
  fs.writeFileSync(mapPath, mapSerialized);
  fs.writeFileSync(cssPath, cssSerialized);
  console.log(`Wrote ${mapPath} (${utilities.length} primitive utilities).`);
  console.log(`Wrote ${cssPath} (${semanticTypes.length} typography utilities).`);
}
