#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const tokenDir = path.join(skillDir, "assets", "design-system");
const outputPath = path.join(tokenDir, "pixso-variables.json");
const tokensStudioPath = path.join(tokenDir, "pixso-tokens-studio.json");
const pluginDir = path.join(scriptDir, "pixso-token-sync-plugin");
const pluginManifestPath = path.join(pluginDir, "manifest.json");
const pluginMainPath = path.join(pluginDir, "main.js");

const sourceFiles = {
  color: "tokens.colors.json",
  spacing: "tokens.spacing.json",
  size: "tokens.size.json",
  radius: "tokens.radius.json",
  shadow: "tokens.shadow.json",
  typography: "tokens.typography.json",
  layout: "tokens.layout.json",
  icon: "tokens.icon.json",
};

const source = Object.fromEntries(
  Object.entries(sourceFiles).map(([key, filename]) => [
    key,
    JSON.parse(fs.readFileSync(path.join(tokenDir, filename), "utf8")),
  ]),
);
const coreBaseline = JSON.parse(
  fs.readFileSync(path.join(tokenDir, "pixso-core-baseline.json"), "utf8"),
);

const failures = [];
const aliases = {};

function fail(message) {
  failures.push(message);
}

function getAtPath(root, ref) {
  const segments = ref.split(".");
  let value = root;
  for (const segment of segments) {
    if (value == null || typeof value !== "object" || !(segment in value)) {
      return undefined;
    }
    value = value[segment];
  }
  return value;
}

function resolveReference(ref, roots, trail = []) {
  if (trail.includes(ref)) {
    fail(`Circular reference: ${[...trail, ref].join(" -> ")}`);
    return undefined;
  }

  for (const root of roots) {
    const direct = getAtPath(root, ref);
    const semantic = getAtPath(root.semantic ?? {}, ref);
    const candidate = direct === undefined ? semantic : direct;
    if (candidate !== undefined) {
      if (typeof candidate === "string" && !isLiteral(candidate)) {
        return resolveReference(candidate, roots, [...trail, ref]);
      }
      return candidate;
    }
  }

  fail(`Unresolved reference: ${ref}`);
  return undefined;
}

function isLiteral(value) {
  return (
    /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) ||
    /^-?\d+(\.\d+)?px$/.test(value) ||
    /^-?\d+(\.\d+)?$/.test(value) ||
    value === "transparent" ||
    value === "none" ||
    value === "fluid-desktop" ||
    value === "1fr"
  );
}

function numberFrom(value, label) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^-?\d+(\.\d+)?px$/.test(value)) {
    return Number.parseFloat(value);
  }
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number.parseFloat(value);
  }
  fail(`Expected number for ${label}, got ${JSON.stringify(value)}`);
  return 0;
}

function colorFrom(value, label) {
  if (value === "transparent") return "#00000000";
  if (typeof value === "string" && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) {
    return value.toUpperCase();
  }
  fail(`Expected color for ${label}, got ${JSON.stringify(value)}`);
  return "#FF00FFFF";
}

function addVariable(target, name, type, value, metadata = {}) {
  if (target[name]) {
    fail(`Duplicate variable: ${name}`);
    return;
  }
  target[name] = { type, value, ...metadata };
}

function addResolvedVariable(target, name, type, raw, roots, sourcePath) {
  const referenced = typeof raw === "string" && !isLiteral(raw);
  const resolved = referenced ? resolveReference(raw, roots) : raw;
  const value =
    type === "color"
      ? colorFrom(resolved, name)
      : type === "number"
        ? numberFrom(resolved, name)
        : String(resolved);
  const metadata = { source: sourcePath };
  if (referenced) {
    metadata.aliasOf = raw;
    aliases[name] = raw;
  }
  addVariable(target, name, type, value, metadata);
}

function flattenLeaves(value, prefix, callback) {
  for (const [key, entry] of Object.entries(value)) {
    if (key === "rules" || key === "roles" || key === "styles") continue;
    const name = prefix ? `${prefix}/${key}` : key;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      flattenLeaves(entry, name, callback);
    } else {
      callback(name, entry);
    }
  }
}

const colorVariables = {};
for (const [group, values] of Object.entries(source.color)) {
  if (group === "semantic") continue;
  if (values && typeof values === "object") {
    flattenLeaves(values, group, (name, value) =>
      addResolvedVariable(
        colorVariables,
        name,
        "color",
        value,
        [source.color],
        `tokens.colors.json:${group}`,
      ),
    );
  } else if (typeof values === "string" && values.startsWith("#")) {
    addResolvedVariable(
      colorVariables,
      group,
      "color",
      values,
      [source.color],
      `tokens.colors.json:${group}`,
    );
  }
}

// Pixso exposes only the five primitive color families. Implementation-level
// semantic aliases stay in CSS/JSON and resolve to these core colors without
// becoming duplicate variables in the Color picker.

const dimensionVariables = {};
flattenLeaves(source.spacing.space, "foundation/spacing", (name, value) =>
  addResolvedVariable(
    dimensionVariables,
    name,
    "number",
    value,
    [source.spacing],
    `tokens.spacing.json:space.${name.split("/").at(-1)}`,
  ),
);
for (const category of ["gap", "padding"]) {
  flattenLeaves(source.spacing[category], `component/spacing/${category}`, (name, value) =>
    addResolvedVariable(
      dimensionVariables,
      name,
      "number",
      value,
      [source.spacing],
      `tokens.spacing.json:${category}.${name.split("/").at(-1)}`,
    ),
  );
}

flattenLeaves(source.size.size, "foundation/size", (name, value) =>
  addResolvedVariable(
    dimensionVariables,
    name,
    "number",
    value,
    [source.size],
    `tokens.size.json:size.${name.split("/").at(-1)}`,
  ),
);
for (const category of ["icon", "indicator", "component", "modal"]) {
  flattenLeaves(source.size[category], `component/size/${category}`, (name, value) =>
    addResolvedVariable(
      dimensionVariables,
      name,
      "number",
      value,
      [source.size],
      `tokens.size.json:${category}.${name.split("/").at(-1)}`,
    ),
  );
}

flattenLeaves(source.radius.radius, "foundation/radius", (name, value) =>
  addResolvedVariable(
    dimensionVariables,
    name,
    "number",
    value,
    [source.radius],
    `tokens.radius.json:radius.${name.split("/").at(-1)}`,
  ),
);
flattenLeaves(source.radius.semantic, "component/radius", (name, value) =>
  addResolvedVariable(
    dimensionVariables,
    name,
    "number",
    value,
    [source.radius],
    `tokens.radius.json:semantic.${name.split("/").at(-1)}`,
  ),
);

for (const [name, value] of Object.entries(source.color.semantic)) {
  if (typeof value === "number") {
    addVariable(dimensionVariables, `semantic/opacity/${name}`, "number", value, {
      source: `tokens.colors.json:semantic.${name}`,
    });
  }
}

const stringVariables = {};
for (const [section, entries] of Object.entries(source.layout)) {
  if (section === "spacing") continue;
  flattenLeaves(entries, `layout/${section}`, (name, raw) => {
    const isReference =
      typeof raw === "string" &&
      !isLiteral(raw) &&
      [source.layout, source.spacing].some(
        (root) => getAtPath(root, raw) !== undefined || getAtPath(root.semantic ?? {}, raw) !== undefined,
      );
    const resolved =
      isReference
        ? resolveReference(raw, [source.layout, source.spacing])
        : raw;
    if (
      typeof resolved === "number" ||
      (typeof resolved === "string" && /^-?\d+(\.\d+)?px$/.test(resolved))
    ) {
      addResolvedVariable(
        dimensionVariables,
        name,
        "number",
        raw,
        [source.spacing, source.layout],
        `tokens.layout.json:${section}.${name.split("/").slice(2).join(".")}`,
      );
    } else {
      addVariable(stringVariables, name, "string", String(raw), {
        source: `tokens.layout.json:${section}.${name.split("/").slice(2).join(".")}`,
      });
    }
  });
}
flattenLeaves(source.layout.spacing, "layout/spacing", (name, raw) =>
  addResolvedVariable(
    dimensionVariables,
    name,
    "number",
    raw,
    [source.spacing, source.layout],
    `tokens.layout.json:spacing.${name.split("/").at(-1)}`,
  ),
);

const typographyVariables = {};
const typographyGroups = [
  ["font-size", "number"],
  ["line-height", "number"],
  ["font-weight", "number"],
  ["letter-spacing", "number"],
];
for (const [group, type] of typographyGroups) {
  flattenLeaves(source.typography[group], `foundation/typography/${group}`, (name, raw) =>
    addResolvedVariable(
      typographyVariables,
      name,
      type,
      raw,
      [source.typography],
      `tokens.typography.json:${group}.${name.split("/").at(-1)}`,
    ),
  );
}
addVariable(
  typographyVariables,
  "foundation/typography/font-family/sans",
  "string",
  source.typography["font-family"].sans[0],
  { source: "tokens.typography.json:font-family.sans" },
);

const coreSizeSourceByValue = new Map(
  Object.entries(source.size.size).map(([name, value]) => [
    Number.parseFloat(value),
    `tokens.size.json:size.${name}`,
  ]),
);
const coreRadiusSourceByValue = new Map(
  Object.entries(source.radius.radius).map(([name, value]) => [
    Number.parseFloat(value),
    `tokens.radius.json:radius.${name}`,
  ]),
);
const coreLayoutSources = {
  "layout/divider/0.5": ["tokens.layout.json:shell.navigation-divider-width", 0.5],
  "layout/width/240": ["tokens.layout.json:shell.sidebar-width", 240],
  "layout/width/360": ["tokens.layout.json:shell.secondary-pane-width", 360],
  "layout/width/400": ["tokens.size.json:modal.dialog-width", 400],
  "layout/width/480": ["tokens.size.json:modal.width-s", 480],
  "layout/width/640": ["tokens.size.json:modal.width-m", 640],
  "layout/width/800": ["tokens.size.json:modal.width-l", 800],
  "layout/width/1100": ["tokens.layout.json:window.min-width", 1100],
  "layout/width/1728": ["tokens.layout.json:frame.width", 1728],
  "layout/height/720": ["tokens.layout.json:window.min-height", 720],
  "layout/height/1152": ["tokens.layout.json:frame.height", 1152],
};

function coreVariableDefinition(collection, name) {
  if (collection === "Color") {
    const definition = colorVariables[name];
    if (!definition) throw new Error(`Missing core color definition: ${name}`);
    return definition;
  }
  if (collection === "Spacing") {
    const key = name.split("/").at(-1);
    return {
      type: "number",
      value: numberFrom(source.spacing.space[key], name),
      source: `tokens.spacing.json:space.${key}`,
    };
  }
  if (collection === "Size & Layout") {
    if (name.startsWith("icon/stroke/")) {
      const size = name.split("/").at(-1);
      const value = Number(source.icon.lucide?.["project-stroke-width-by-display-size"]?.[size]);
      if (!Number.isFinite(value)) throw new Error(`Missing icon stroke source: ${name}`);
      return { type: "number", value, source: `tokens.icon.json:lucide.project-stroke-width-by-display-size.${size}` };
    }
    if (name.startsWith("size/")) {
      const value = Number.parseFloat(name.split("/").at(-1));
      const sourcePath = coreSizeSourceByValue.get(value);
      if (!sourcePath) throw new Error(`Missing core size source: ${name}`);
      return { type: "number", value, source: sourcePath };
    }
    if (name.startsWith("radius/")) {
      const suffix = name.split("/").at(-1);
      const value = suffix === "full" ? 999 : Number.parseFloat(suffix);
      const sourcePath = coreRadiusSourceByValue.get(value);
      if (!sourcePath) throw new Error(`Missing core radius source: ${name}`);
      return { type: "number", value, source: sourcePath };
    }
    if (coreLayoutSources[name]) {
      const [sourcePath, value] = coreLayoutSources[name];
      return { type: "number", value, source: sourcePath };
    }
    if (name === "opacity/40") {
      return {
        type: "number",
        value: 40,
        webValue: source.color.semantic["state-disabled-opacity"],
        cssVariable: "--opacity-40",
        valueTransform: "pixso-percent-to-css-unit-interval",
        source: "tokens.colors.json:semantic.state-disabled-opacity",
      };
    }
  }
  if (collection === "Typography") {
    if (name === "font/family/sans") {
      return {
        type: "string",
        value: source.typography["font-family"].sans[0],
        source: "tokens.typography.json:font-family.sans",
      };
    }
    const [, group, key] = name.split("/");
    const sourceGroup = {
      size: "font-size",
      "line-height": "line-height",
      weight: "font-weight",
      "letter-spacing": "letter-spacing",
    }[group];
    const sourceKey = group === "letter-spacing" ? "normal" : key;
    return {
      type: "number",
      value: numberFrom(source.typography[sourceGroup][sourceKey], name),
      source: `tokens.typography.json:${sourceGroup}.${sourceKey}`,
    };
  }
  throw new Error(`Unsupported core variable: ${collection}/${name}`);
}

const coreCollections = Object.entries(coreBaseline.collections).map(
  ([name, definition]) => ({
    name,
    modes: [definition.mode],
    variables: Object.fromEntries(
      definition.tokens.map((token) => [
        token,
        coreVariableDefinition(name, token),
      ]),
    ),
  }),
);

const textStyles = {};
function pixsoTextStyleName(name) {
  return name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("_");
}

for (const [name, style] of Object.entries(source.typography.styles)) {
  const fontFamilyRef = style["font-family"];
  const family = resolveReference(fontFamilyRef, [source.typography]);
  const familyValue = Array.isArray(family) ? family[0] : family;
  textStyles[`Typography/${pixsoTextStyleName(name)}`] = {
    type: "text",
    fontFamily: familyValue,
    fontSize: numberFrom(resolveReference(style["font-size"], [source.typography]), name),
    lineHeight: `${numberFrom(resolveReference(style["line-height"], [source.typography]), name)}px`,
    fontWeight: numberFrom(resolveReference(style["font-weight"], [source.typography]), name),
    letterSpacing: "0px",
    source: `tokens.typography.json:styles.${name}`,
  };
}

const effectStyles = {};
for (const [name, shadow] of Object.entries(source.shadow)) {
  // Policy metadata describes where shadows may be used; it is not an effect
  // token and must not be interpreted as one when building Pixso styles.
  if (name === "roles" || name === "usagePolicy") continue;
  effectStyles[`Effect/Foundation/${name}`] = {
    type: "effect",
    effects: [
      {
        type: "DROP_SHADOW",
        color: colorFrom(shadow.color, name),
        opacity: shadow.opacity,
        offset: { x: shadow.x, y: shadow.y },
        radius: shadow.blur,
        spread: shadow.spread,
        visible: true,
      },
    ],
    source: `tokens.shadow.json:${name}`,
  };
}
// Semantic names remain in tokens.shadow.json and effect-style-map.json. Pixso
// exposes only the six physical Foundation styles, avoiding duplicate effects.

const manifest = {
  $schema: "https://tokens.studio/schema.json",
  name: "HarmonyOS PC / Pixso Token Manifest",
  version: 3,
  platform: "HarmonyOS PC client",
  generatedFrom: [
    ...Object.values(sourceFiles).map((filename) => `assets/design-system/${filename}`),
    "assets/design-system/pixso-core-baseline.json",
  ],
  importOrder: [
    "Color",
    "Spacing",
    "Size & Layout",
    "Typography",
    "Text Styles",
    "Effect Styles",
  ],
  collections: coreCollections,
  styles: {
    text: textStyles,
    effect: effectStyles,
  },
  aliasGraph: aliases,
  pixsoLimitations: [
    "Pixso MCP variable aliases are flattened to resolved values; aliasOf preserves provenance.",
    "Composite typography is represented by shared text styles plus atomic variables.",
    "Shadows are represented by shared effect styles, not variables.",
    "Opacity variables use Pixso percentage values; opacity/40 is 40 in Pixso and 0.4 in CSS.",
  ],
  rules: [
    "Create and read back variables before creating components.",
    "Bind Pixso colors directly to Brand, Neutral Dark, Neutral Light, Function, or Multi core variables.",
    "Do not create duplicate semantic color aliases in Pixso.",
    "Keep only the 127 primitive variables declared by pixso-core-baseline.json.",
    "Map code-side semantic aliases to primitives; never create component/* or layout/shell/* variables.",
    "Main Content and Main Detail use X 24px, T 16px, B 0px.",
    "All Button and Split Button icon-label pairs use the 8px component spacing token.",
  ],
};

function validateManifest(value) {
  const names = new Set();
  const supportedTypes = new Set(["color", "number", "string"]);
  for (const collection of value.collections) {
    for (const [name, variable] of Object.entries(collection.variables)) {
      const qualified = `${collection.name}/${name}`;
      if (names.has(qualified)) fail(`Duplicate qualified variable: ${qualified}`);
      names.add(qualified);
      if (!supportedTypes.has(variable.type)) {
        fail(`Unsupported type ${variable.type}: ${qualified}`);
      }
      if (variable.type === "color" && !/^#[0-9A-F]{8}$|^#[0-9A-F]{6}$/.test(variable.value)) {
        fail(`Invalid color ${qualified}: ${variable.value}`);
      }
      if (variable.type === "number" && !Number.isFinite(variable.value)) {
        fail(`Invalid number ${qualified}: ${variable.value}`);
      }
    }
  }
}

validateManifest(manifest);

if (failures.length) {
  console.error("Pixso token manifest validation failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
function setNestedToken(target, tokenPath, token) {
  const segments = tokenPath.split("/");
  const leaf = segments.pop();
  let parent = target;
  for (const segment of segments) {
    parent[segment] ??= {};
    parent = parent[segment];
  }
  parent[leaf] = token;
}

function toTokensStudioToken(name, variable) {
  if (variable.type === "color") {
    return { value: variable.value, type: "color", description: variable.source };
  }
  if (variable.type === "string") {
    return { value: variable.value, type: "text", description: variable.source };
  }
  const unitless =
    name.startsWith("opacity/") ||
    name.startsWith("font/weight/") ||
    name.endsWith("/columns");
  return {
    value: unitless ? variable.value : `${variable.value}px`,
    type: unitless ? "number" : "dimension",
    description: variable.source,
  };
}

const tokensStudio = {};
for (const collection of manifest.collections) {
  const set = {};
  for (const [name, variable] of Object.entries(collection.variables)) {
    setNestedToken(set, name, toTokensStudioToken(name, variable));
  }
  tokensStudio[collection.name] = set;
}
tokensStudio.$metadata = {
  tokenSetOrder: manifest.collections.map((collection) => collection.name),
};
const tokensStudioSerialized = `${JSON.stringify(tokensStudio, null, 2)}\n`;
const pluginManifest = {
  name: "HarmonyOS PC Token Sync",
  id: "harmonyos-pc-token-sync",
  editorType: ["pixso"],
  main: "./main.js",
  menu: [{ name: "同步 Token", command: "sync" }],
};
const pluginPayload = manifest.collections.map((collection) => ({
  name: collection.name,
  modes: collection.modes,
  variables: Object.entries(collection.variables).map(([name, variable]) => ({
    name,
    type: variable.type,
    value: variable.value,
    description: variable.source,
  })),
}));
const pluginMain = `const TOKEN_COLLECTIONS = ${JSON.stringify(pluginPayload)};

function colorToRgba(hex) {
  const value = hex.replace("#", "");
  const expanded = value.length === 6 ? value + "FF" : value;
  return {
    r: parseInt(expanded.slice(0, 2), 16) / 255,
    g: parseInt(expanded.slice(2, 4), 16) / 255,
    b: parseInt(expanded.slice(4, 6), 16) / 255,
    a: parseInt(expanded.slice(6, 8), 16) / 255,
  };
}

function pixsoType(type) {
  if (type === "color") return "COLOR";
  if (type === "number") return "FLOAT";
  if (type === "string") return "STRING";
  throw new Error("Unsupported variable type: " + type);
}

function pixsoValue(variable) {
  return variable.type === "color" ? colorToRgba(variable.value) : variable.value;
}

async function syncTokens() {
  const existingCollections = await pixso.variables.getLocalVariableCollectionsAsync();
  const existingVariables = await pixso.variables.getLocalVariablesAsync();
  const collectionByName = new Map(existingCollections.map((item) => [item.name, item]));
  let created = 0;
  let updated = 0;

  for (const definition of TOKEN_COLLECTIONS) {
    let collection = collectionByName.get(definition.name);
    if (!collection) {
      collection = pixso.variables.createVariableCollection(definition.name);
      collectionByName.set(definition.name, collection);
    }

    const modeByName = new Map(collection.modes.map((mode) => [mode.name, mode]));
    if (!modeByName.has(definition.modes[0])) {
      collection.renameMode(collection.defaultModeId, definition.modes[0]);
    }
    for (const modeName of definition.modes.slice(1)) {
      if (!collection.modes.some((mode) => mode.name === modeName)) {
        collection.addMode(modeName);
      }
    }

    const localByName = new Map(
      existingVariables
        .filter((variable) => variable.variableCollectionId === collection.id)
        .map((variable) => [variable.name, variable]),
    );

    for (const definitionVariable of definition.variables) {
      const resolvedType = pixsoType(definitionVariable.type);
      let variable = localByName.get(definitionVariable.name);
      if (variable && variable.resolvedType !== resolvedType) {
        variable.remove();
        variable = undefined;
      }
      if (!variable) {
        variable = pixso.variables.createVariable(
          definitionVariable.name,
          collection,
          resolvedType,
        );
        localByName.set(definitionVariable.name, variable);
        created += 1;
      } else {
        updated += 1;
      }
      variable.description = definitionVariable.description || "";
      for (const mode of collection.modes) {
        if (definition.modes.includes(mode.name)) {
          variable.setValueForMode(mode.modeId, pixsoValue(definitionVariable));
        }
      }
    }
  }

  const total = TOKEN_COLLECTIONS.reduce(
    (sum, collection) => sum + collection.variables.length,
    0,
  );
  pixso.notify(
    "Token 同步完成：" + total + " 个变量（新增 " + created + "，更新 " + updated + "）",
  );
  pixso.closePlugin();
}

syncTokens().catch((error) => {
  pixso.notify("Token 同步失败：" + error.message, { error: true });
  pixso.closePlugin();
});
`;

const args = new Set(process.argv.slice(2));
if (args.has("--write")) {
  fs.writeFileSync(outputPath, serialized);
  fs.writeFileSync(tokensStudioPath, tokensStudioSerialized);
  fs.mkdirSync(pluginDir, { recursive: true });
  fs.writeFileSync(pluginManifestPath, `${JSON.stringify(pluginManifest, null, 2)}\n`);
  fs.writeFileSync(pluginMainPath, pluginMain);
  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${tokensStudioPath}`);
  console.log(`Wrote ${pluginDir}`);
} else if (args.has("--check")) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "";
  const tokensStudioCurrent = fs.existsSync(tokensStudioPath)
    ? fs.readFileSync(tokensStudioPath, "utf8")
    : "";
  const pluginManifestCurrent = fs.existsSync(pluginManifestPath)
    ? fs.readFileSync(pluginManifestPath, "utf8")
    : "";
  const pluginMainCurrent = fs.existsSync(pluginMainPath)
    ? fs.readFileSync(pluginMainPath, "utf8")
    : "";
  if (
    current !== serialized ||
    tokensStudioCurrent !== tokensStudioSerialized ||
    pluginManifestCurrent !== `${JSON.stringify(pluginManifest, null, 2)}\n` ||
    pluginMainCurrent !== pluginMain
  ) {
    console.error(`Out of date: ${outputPath}`);
    process.exit(1);
  }
  console.log(`Up to date: ${outputPath}`);
  console.log(`Up to date: ${tokensStudioPath}`);
  console.log(`Up to date: ${pluginDir}`);
} else {
  process.stdout.write(serialized);
}

const summary = Object.fromEntries(
  manifest.collections.map((collection) => [
    collection.name,
    Object.keys(collection.variables).length,
  ]),
);
summary.textStyles = Object.keys(manifest.styles.text).length;
summary.effectStyles = Object.keys(manifest.styles.effect).length;
console.error(JSON.stringify(summary));
