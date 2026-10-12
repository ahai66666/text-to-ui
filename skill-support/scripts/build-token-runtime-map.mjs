import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const core = readJson("assets/design-system/pixso-core-baseline.json");
const additions = readJson("assets/design-system/pixso-manual-additions.json");
const colorTokens = readJson("assets/design-system/tokens.colors.json");
const spacingTokens = readJson("assets/design-system/tokens.spacing.json");
const sizeTokens = readJson("assets/design-system/tokens.size.json");
const radiusTokens = readJson("assets/design-system/tokens.radius.json");
const layoutTokens = readJson("assets/design-system/tokens.layout.json");
const outputPath = path.join(
  root,
  "assets/design-system/token-runtime-map.json",
);
const tableOutputPath = path.join(
  root,
  "assets/design-system/core-foundation-token-table.md",
);

const cssFiles = [
  "tokens.colors.css",
  "tokens.spacing.css",
  "tokens.size.css",
  "tokens.radius.css",
  "tokens.typography.css",
  "tokens.layout.css",
  "tokens.icon.css",
].map((name) => path.join(root, "assets/design-system", name));
const cssSource = cssFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const cssValues = new Map(
  [...cssSource.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
    match[1],
    match[2].trim(),
  ]),
);

function resolveCss(cssVariable, seen = new Set()) {
  if (seen.has(cssVariable)) throw new Error(`CSS variable cycle at ${cssVariable}`);
  seen.add(cssVariable);
  const raw = cssValues.get(cssVariable);
  if (raw == null) throw new Error(`Missing CSS variable ${cssVariable}`);
  const reference = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
  return reference ? resolveCss(reference[1], seen) : raw;
}

const overrides = {
  "size/04": "--size-1",
  "size/06": "--size-2",
  "size/08": "--size-3",
  "size/12": "--size-4",
  "size/16": "--size-5",
  "size/20": "--size-6",
  "size/24": "--size-7",
  "size/28": "--size-8",
  "size/32": "--size-9",
  "size/36": "--size-10",
  "size/40": "--size-11",
  "size/44": "--size-12",
  "size/48": "--size-13",
  "size/56": "--size-14",
  "size/64": "--size-15",
  "size/72": "--size-16",
  "size/80": "--size-17",
  "radius/0": "--radius-0",
  "radius/04": "--radius-1",
  "radius/06": "--radius-2",
  "radius/08": "--radius-3",
  "radius/12": "--radius-4",
  "radius/16": "--radius-5",
  "radius/full": "--radius-full",
  "layout/divider/0.5": "--layout-navigation-divider-width",
  "layout/width/240": "--layout-sidebar-width",
  "layout/width/360": "--layout-secondary-pane-width",
  "layout/width/400": "--width-dialog",
  "layout/width/480": "--width-modal-sm",
  "layout/width/640": "--width-modal-md",
  "layout/width/800": "--width-modal-lg",
  "layout/width/1100": "--layout-window-min-width",
  "layout/width/1728": "--layout-frame-width",
  "layout/height/720": "--layout-window-min-height",
  "layout/height/1152": "--layout-frame-height",
  "opacity/40": "--opacity-40",
};

function defaultCssName(token) {
  if (/^(brand|neutral-|function|multi\/)/.test(token)) {
    return `--color-${token.replaceAll("/", "-")}`;
  }
  if (/^(space|gap|padding)\//.test(token)) {
    return `--${token.replaceAll("/", "-")}`;
  }
  if (token.startsWith("icon/stroke/")) {
    return `--icon-outline-stroke-width-${token.split("/").at(-1)}`;
  }
  if (token === "font/family/sans") return "--font-sans";
  if (token.startsWith("font/size/")) return `--font-size-${token.split("/").at(-1)}`;
  if (token.startsWith("font/line-height/")) {
    return `--line-height-${token.split("/").at(-1)}`;
  }
  if (token.startsWith("font/weight/")) {
    return `--font-weight-${token.split("/").at(-1)}`;
  }
  if (token === "font/letter-spacing/0") return "--letter-spacing-normal";
  return overrides[token];
}

const tokenEntries = [];
for (const [collection, definition] of Object.entries(core.collections)) {
  for (const pixsoVariable of definition.tokens) {
    tokenEntries.push({
      pixsoCollection: collection,
      pixsoMode: definition.mode,
      pixsoVariable,
    });
  }
}
for (const collection of additions.collections ?? []) {
  for (const variable of collection.variables ?? []) {
    tokenEntries.push({
      pixsoCollection: collection.variableSet,
      pixsoMode: collection.mode,
      pixsoVariable: `${variable.group}/${variable.name}`,
    });
  }
}

const sizeTokenByValue = new Map(
  Object.entries(sizeTokens.size).map(([name, value]) => [
    Number.parseFloat(value),
    `size/${String(Number.parseFloat(value)).padStart(2, "0")}`,
  ]),
);
const radiusTokenByValue = new Map(
  Object.entries(radiusTokens.radius).map(([name, value]) => [
    Number.parseFloat(value),
    name === "full"
      ? "radius/full"
      : `radius/${String(Number.parseFloat(value)).padStart(2, "0")}`,
  ]),
);
const sourceByCoreToken = {
  "layout/divider/0.5": "tokens.layout.json:shell.navigation-divider-width",
  "layout/width/240": "tokens.layout.json:shell.sidebar-width",
  "layout/width/360": "tokens.layout.json:shell.secondary-pane-width",
  "layout/width/400": "tokens.size.json:modal.dialog-width",
  "layout/width/480": "tokens.size.json:modal.width-s",
  "layout/width/640": "tokens.size.json:modal.width-m",
  "layout/width/800": "tokens.size.json:modal.width-l",
  "layout/width/1100": "tokens.layout.json:window.min-width",
  "layout/width/1728": "tokens.layout.json:frame.width",
  "layout/height/720": "tokens.layout.json:window.min-height",
  "layout/height/1152": "tokens.layout.json:frame.height",
  "opacity/40": "tokens.colors.json:semantic.state-disabled-opacity",
};

function sourceTokenFor(pixsoVariable) {
  if (/^(brand|neutral-|function|multi\/)/.test(pixsoVariable)) {
    return `tokens.colors.json:${pixsoVariable.replaceAll("/", ".")}`;
  }
  if (pixsoVariable.startsWith("space/")) {
    return `tokens.spacing.json:${pixsoVariable.replace("/", ".")}`;
  }
  if (pixsoVariable.startsWith("icon/stroke/")) {
    return `tokens.icon.json:lucide.project-stroke-width-by-display-size.${pixsoVariable.split("/").at(-1)}`;
  }
  if (pixsoVariable.startsWith("size/")) {
    const value = Number.parseFloat(pixsoVariable.split("/").at(-1));
    const sourceName = Object.entries(sizeTokens.size).find(
      ([, entry]) => Number.parseFloat(entry) === value,
    )?.[0];
    return `tokens.size.json:size.${sourceName}`;
  }
  if (pixsoVariable.startsWith("radius/")) {
    const suffix = pixsoVariable.split("/").at(-1);
    const value = suffix === "full" ? 999 : Number.parseFloat(suffix);
    const sourceName = Object.entries(radiusTokens.radius).find(
      ([, entry]) => Number.parseFloat(entry) === value,
    )?.[0];
    return `tokens.radius.json:radius.${sourceName}`;
  }
  if (sourceByCoreToken[pixsoVariable]) return sourceByCoreToken[pixsoVariable];
  if (pixsoVariable === "font/family/sans") {
    return "tokens.typography.json:font-family.sans";
  }
  if (pixsoVariable.startsWith("font/size/")) {
    return `tokens.typography.json:font-size.${pixsoVariable.split("/").at(-1)}`;
  }
  if (pixsoVariable.startsWith("font/line-height/")) {
    return `tokens.typography.json:line-height.${pixsoVariable.split("/").at(-1)}`;
  }
  if (pixsoVariable.startsWith("font/weight/")) {
    return `tokens.typography.json:font-weight.${pixsoVariable.split("/").at(-1)}`;
  }
  if (pixsoVariable === "font/letter-spacing/0") {
    return "tokens.typography.json:letter-spacing.normal";
  }
  throw new Error(`No source Token for ${pixsoVariable}`);
}

function pixsoValueFor(pixsoVariable, resolvedCssValue) {
  if (pixsoVariable === "opacity/40") return 40;
  if (/^(brand|neutral-|function|multi\/)/.test(pixsoVariable)) {
    return resolvedCssValue;
  }
  if (pixsoVariable === "font/family/sans") return "HarmonyOS Sans SC";
  return Number.parseFloat(resolvedCssValue);
}

const mappings = tokenEntries.map((entry) => {
  const cssVariable = overrides[entry.pixsoVariable] ?? defaultCssName(entry.pixsoVariable);
  if (!cssVariable) throw new Error(`No CSS mapping for ${entry.pixsoVariable}`);
  const resolvedCssValue = resolveCss(cssVariable);
  return {
    ...entry,
    sourceToken: sourceTokenFor(entry.pixsoVariable),
    cssVariable,
    resolvedCssValue,
    pixsoValue: pixsoValueFor(entry.pixsoVariable, resolvedCssValue),
    valueTransform:
      entry.pixsoVariable === "opacity/40"
        ? "pixso-percent-to-css-unit-interval"
        : "identity",
  };
});

const semanticRoles = {
  "action/primary/background": {
    cssVariable: "--color-brand-100",
    pixsoVariable: "brand/100",
  },
  "content/primary": {
    cssVariable: "--color-text",
    pixsoVariable: "neutral-dark/90",
  },
  "content/secondary": {
    cssVariable: "--color-text-muted",
    pixsoVariable: "neutral-dark/60",
  },
  "content/tertiary": {
    cssVariable: "--color-text-subtle",
    pixsoVariable: "neutral-dark/40",
  },
  "content/inverse": {
    cssVariable: "--color-text-inverse",
    pixsoVariable: "neutral-light/100",
  },
  "surface/default": {
    cssVariable: "--color-surface",
    pixsoVariable: "neutral-light/100",
  },
  "surface/subtle": {
    cssVariable: "--color-surface-muted",
    pixsoVariable: "neutral-dark/05",
  },
  "state/selected": {
    cssVariable: "--color-sidebar-selected",
    pixsoVariable: "brand/10",
  },
  "state/hover": {
    cssVariable: "--state-layer-hover",
    pixsoVariable: "neutral-dark/05",
  },
  "state/pressed": {
    cssVariable: "--state-layer-pressed",
    pixsoVariable: "neutral-dark/10",
  },
  "spacing/button-icon-label": {
    cssVariable: "--gap-button-icon-label",
    pixsoVariable: "space/3",
  },
  "spacing/button-group": {
    cssVariable: "--gap-button-group",
    pixsoVariable: "space/3",
  },
  "spacing/field-label": {
    cssVariable: "--gap-field-label",
    pixsoVariable: "space/3",
  },
  "spacing/form-field": {
    cssVariable: "--gap-form-field",
    pixsoVariable: "space/5",
  },
  "spacing/button-padding-x": {
    cssVariable: "--padding-button-x",
    pixsoVariable: "space/5",
  },
  "spacing/card-padding": {
    cssVariable: "--padding-card",
    pixsoVariable: "space/6",
  },
  "spacing/table-padding": {
    cssVariable: "--padding-table",
    pixsoVariable: "space/6",
  },
  "size/control": {
    cssVariable: "--height-button",
    pixsoVariable: "size/40",
  },
  "size/icon-sm": {
    cssVariable: "--icon-size-sm",
    pixsoVariable: "size/16",
  },
  "size/icon-md": {
    cssVariable: "--icon-size-md",
    pixsoVariable: "size/20",
  },
  "size/icon-lg": {
    cssVariable: "--icon-size-lg",
    pixsoVariable: "size/24",
  },
  "radius/control": {
    cssVariable: "--radius-button",
    pixsoVariable: "radius/08",
  },
  "radius/card": {
    cssVariable: "--radius-card",
    pixsoVariable: "radius/12",
  },
  "layout/frame-width": {
    cssVariable: "--layout-frame-width",
    pixsoVariable: "layout/width/1728",
  },
  "layout/frame-height": {
    cssVariable: "--layout-frame-height",
    pixsoVariable: "layout/height/1152",
  },
  "layout/sidebar-expanded": {
    cssVariable: "--layout-sidebar-width",
    pixsoVariable: "layout/width/240",
  },
  "layout/sidebar-collapsed": {
    cssVariable: "--layout-sidebar-width-collapsed",
    pixsoVariable: "size/64",
  },
  "layout/secondary-pane": {
    cssVariable: "--layout-secondary-pane-width",
    pixsoVariable: "layout/width/360",
  },
  "layout/navigation-divider": {
    cssVariable: "--layout-navigation-divider-width",
    pixsoVariable: "layout/divider/0.5",
  },
  "opacity/disabled": {
    cssVariable: "--state-disabled-opacity",
    pixsoVariable: "opacity/40",
  },
  "opacity/window-unfocus": {
    cssVariable: "--state-window-unfocus-opacity",
    pixsoVariable: "opacity/40",
  }
};

function addSemanticRole(role, cssVariable, pixsoVariable, sourceToken) {
  semanticRoles[role] = { cssVariable, pixsoVariable, sourceToken };
}

for (const [name, value] of Object.entries(colorTokens.semantic)) {
  if (typeof value !== "string" || value === "transparent") continue;
  const pixsoVariable = value.replaceAll(".", "/");
  if (!mappings.some((item) => item.pixsoVariable === pixsoVariable)) continue;
  const cssVariable = `--${name.startsWith("state-") ? name : `color-${name}`}`;
  if (!cssValues.has(cssVariable)) continue;
  addSemanticRole(
    `color/${name}`,
    cssVariable,
    pixsoVariable,
    `tokens.colors.json:semantic.${name}`,
  );
}

for (const category of ["gap", "padding"]) {
  for (const [name, reference] of Object.entries(spacingTokens[category])) {
    addSemanticRole(
      `spacing/${category}/${name}`,
      `--${category}-${name}`,
      reference.replace(".", "/"),
      `tokens.spacing.json:${category}.${name}`,
    );
  }
}

function cssNameForSize(group, name) {
  if (group === "icon") return `--icon-size-${name}`;
  if (group === "indicator") {
    const rewrites = {
      "badge-height": "height-badge",
      "progress-height": "height-progress",
      "avatar-sm-size": "size-avatar-sm",
      "avatar-md-size": "size-avatar-md",
    };
    return `--${rewrites[name] ?? name}`;
  }
  if (group === "component") {
    for (const [suffix, prefix] of [
      ["-min-height", "--min-height-"],
      ["-height", "--height-"],
      ["-width", "--width-"],
      ["-size", "--size-"],
    ]) {
      if (name.endsWith(suffix)) {
        return `${prefix}${name.slice(0, -suffix.length)}`;
      }
    }
  }
  if (group === "modal") {
    return `--${{
      "width-s": "width-modal-sm",
      "width-m": "width-modal-md",
      "width-l": "width-modal-lg",
      "dialog-width": "width-dialog",
    }[name]}`;
  }
  return null;
}

for (const group of ["icon", "indicator", "component"]) {
  for (const [name, reference] of Object.entries(sizeTokens[group])) {
    const cssVariable = cssNameForSize(group, name);
    const value = Number.parseFloat(resolveCss(cssVariable));
    addSemanticRole(
      `size/${group}/${name}`,
      cssVariable,
      sizeTokenByValue.get(value),
      `tokens.size.json:${group}.${name}`,
    );
  }
}
for (const [name] of Object.entries(sizeTokens.modal)) {
  const cssVariable = cssNameForSize("modal", name);
  const value = Number.parseFloat(resolveCss(cssVariable));
  addSemanticRole(
    `size/modal/${name}`,
    cssVariable,
    `layout/width/${value}`,
    `tokens.size.json:modal.${name}`,
  );
}

for (const [name, reference] of Object.entries(radiusTokens.semantic)) {
  const value = Number.parseFloat(resolveCss(`--radius-${name}`));
  addSemanticRole(
    `radius/${name}`,
    `--radius-${name}`,
    radiusTokenByValue.get(value),
    `tokens.radius.json:semantic.${name}`,
  );
}

const layoutCoreByCss = {
  "--layout-frame-width": "layout/width/1728",
  "--layout-frame-height": "layout/height/1152",
  "--layout-window-min-width": "layout/width/1100",
  "--layout-window-min-height": "layout/height/720",
  "--layout-titlebar-height": "size/64",
  "--layout-sidebar-width": "layout/width/240",
  "--layout-sidebar-width-collapsed": "size/64",
  "--layout-sidebar-width-wide": "layout/width/360",
  "--layout-secondary-pane-width": "layout/width/360",
  "--layout-navigation-divider-width": "layout/divider/0.5",
};
const layoutSourceByCss = {
  "--layout-frame-width": "tokens.layout.json:frame.width",
  "--layout-frame-height": "tokens.layout.json:frame.height",
  "--layout-window-min-width": "tokens.layout.json:window.min-width",
  "--layout-window-min-height": "tokens.layout.json:window.min-height",
  "--layout-titlebar-height": "tokens.layout.json:shell.titlebar-height",
  "--layout-sidebar-width": "tokens.layout.json:shell.sidebar-width",
  "--layout-sidebar-width-collapsed":
    "tokens.layout.json:shell.sidebar-width-collapsed",
  "--layout-sidebar-width-wide": "tokens.layout.json:shell.sidebar-width-wide",
  "--layout-secondary-pane-width":
    "tokens.layout.json:shell.secondary-pane-width",
  "--layout-navigation-divider-width":
    "tokens.layout.json:shell.navigation-divider-width",
};
for (const [cssVariable, pixsoVariable] of Object.entries(layoutCoreByCss)) {
  const name = cssVariable.replace("--layout-", "");
  addSemanticRole(
    `layout/${name}`,
    cssVariable,
    pixsoVariable,
    layoutSourceByCss[cssVariable],
  );
}
for (const name of Object.keys(layoutTokens.spacing)) {
  const cssVariable = `--layout-${name}`;
  const value = Number.parseFloat(resolveCss(cssVariable));
  const pixsoVariable = `space/${
    Object.entries(spacingTokens.space).find(
      ([, entry]) => Number.parseFloat(entry) === value,
    )?.[0]
  }`;
  addSemanticRole(
    `layout/spacing/${name}`,
    cssVariable,
    pixsoVariable,
    `tokens.layout.json:spacing.${name}`,
  );
}

const typographyStyleRoles = {
  "display-l": ["56", "66", "400"],
  "display-m": ["48", "58", "400"],
  "display-s": ["38", "44", "400"],
  "title-l": ["30", "36", "700"],
  "title-m": ["24", "28", "700"],
  "title-s": ["20", "24", "700"],
  "subtitle-l": ["18", "22", "500"],
  "subtitle-m": ["16", "20", "500"],
  "subtitle-s": ["14", "16", "500"],
  "body-l": ["16", "20", "400"],
  "body-m": ["14", "16", "400"],
  "body-s": ["12", "14", "400"],
  "caption-m": ["10", "12", "400"],
};
for (const [style, [size, lineHeight, weight]] of Object.entries(typographyStyleRoles)) {
  semanticRoles[`typography/${style}/font-size`] = {
    cssVariable: `--type-${style}-size`,
    pixsoVariable: `font/size/${size}`,
  };
  semanticRoles[`typography/${style}/line-height`] = {
    cssVariable: `--type-${style}-leading`,
    pixsoVariable: `font/line-height/${lineHeight}`,
  };
  semanticRoles[`typography/${style}/font-weight`] = {
    cssVariable: `--type-${style}-weight`,
    pixsoVariable: `font/weight/${weight}`,
  };
}

for (const role of Object.values(semanticRoles)) {
  role.resolvedCssValue = resolveCss(role.cssVariable);
  const mapped = mappings.find((item) => item.pixsoVariable === role.pixsoVariable);
  if (!mapped) throw new Error(`Semantic role uses unmapped Pixso variable ${role.pixsoVariable}`);
  if (mapped.resolvedCssValue.toLowerCase() !== role.resolvedCssValue.toLowerCase()) {
    throw new Error(
      `Semantic role mismatch ${role.cssVariable} (${role.resolvedCssValue}) != ` +
      `${role.pixsoVariable} (${mapped.resolvedCssValue})`,
    );
  }
  role.sourceToken ??= mapped.sourceToken;
  role.pixsoValue = mapped.pixsoValue;
  role.valueTransform = mapped.valueTransform;
}

export const output = {
  schemaVersion: 1,
  purpose:
    "One-to-one bridge between HTML CSS variables and the approved Pixso core/runtime variables.",
  policy: {
    cssSemanticAliasesRemainCodeOnly: true,
    forbidPixsoLegacyAliases: [
      "brand/primary",
      "surface/*",
      "text/*",
      "icon/*",
      "border/*",
      "divider/*",
      "state/*",
      "status/*",
      "overlay/*",
      "gap/*",
      "padding/*",
      "component/*",
      "display/*",
      "title/*",
      "subtitle/*",
      "body/*",
      "caption/*"
    ],
    sourceArtboardIsNotDisplaySize: true
  },
  mappings,
  semanticRoles
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
const nonColorMappings = mappings.filter((item) => item.pixsoCollection !== "Color");
const colorMappings = mappings.filter((item) => item.pixsoCollection === "Color");
const groupedMappings = Object.groupBy(
  nonColorMappings,
  (item) => item.pixsoCollection,
);
const tableLines = [
  "# Core Foundation Token Table",
  "",
  "Pixso keeps primitive variables only. Component and product semantics stay in code and resolve through `token-runtime-map.json`.",
  "",
  `Total: ${nonColorMappings.length} non-color variables. Together with ${colorMappings.length} colors, the Pixso baseline contains ${mappings.length} variables.`,
  "",
];
for (const collection of ["Spacing", "Size & Layout", "Typography"]) {
  tableLines.push(`## ${collection}`, "", "| Pixso variable | Mode | CSS primitive | Resolved value |", "| --- | --- | --- | --- |");
  for (const item of groupedMappings[collection] ?? []) {
    tableLines.push(
      `| \`${item.pixsoVariable}\` | \`${item.pixsoMode}\` | \`${item.cssVariable}\` | \`${item.resolvedCssValue}\` |`,
    );
  }
  tableLines.push("");
}
tableLines.push(
  "## Code semantic mapping",
  "",
  "| Code role | CSS semantic variable | Pixso primitive | Resolved value |",
  "| --- | --- | --- | --- |",
);
for (const [role, item] of Object.entries(semanticRoles)) {
  if (item.pixsoVariable.startsWith("brand/") ||
      item.pixsoVariable.startsWith("neutral-") ||
      item.pixsoVariable.startsWith("function/") ||
      item.pixsoVariable.startsWith("multi/")) continue;
  tableLines.push(
    `| \`${role}\` | \`${item.cssVariable}\` | \`${item.pixsoVariable}\` | \`${item.resolvedCssValue}\` |`,
  );
}
tableLines.push("");
const tableSerialized = `${tableLines.join("\n").trimEnd()}\n`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
if (process.argv.includes("--check")) {
  if (
    !fs.existsSync(outputPath) ||
    fs.readFileSync(outputPath, "utf8") !== serialized ||
    !fs.existsSync(tableOutputPath) ||
    fs.readFileSync(tableOutputPath, "utf8") !== tableSerialized
  ) {
    console.error(`Stale or missing: ${outputPath} or ${tableOutputPath}`);
    process.exit(1);
  }
  console.log(`Token runtime map current: ${mappings.length} mappings and foundation table.`);
} else {
  fs.writeFileSync(outputPath, serialized);
  fs.writeFileSync(tableOutputPath, tableSerialized);
  console.log(`Wrote ${outputPath} (${mappings.length} mappings).`);
  console.log(`Wrote ${tableOutputPath} (${nonColorMappings.length} non-color variables).`);
}

}
