import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const target = path.join(root, "packages/components-html/src/component-icons.svg");
const lucideIconDir = path.join(root, "skill-support/node_modules/.pnpm/lucide@1.24.0/node_modules/lucide/dist/esm/icons");
// The registry is the canonical source of semantic aliases. Building only a
// hand-picked subset silently removed valid Titlebar/feedback/picker icons.
const aliasRegistry = JSON.parse(await fs.readFile(path.join(root, "skill-support/assets/icons/icon-aliases.json"), "utf8"));
const lucideAliases = Object.fromEntries(Object.entries(aliasRegistry.aliases)
  .filter(([, definition]) => definition.source === "lucide")
  .map(([alias, definition]) => [alias, definition.name]));
const symbols = [];
for (const [alias, source] of Object.entries(lucideAliases)) {
  const iconModule = await import(pathToFileURL(path.join(lucideIconDir, `${source}.mjs`)).href);
  if (!Array.isArray(iconModule.default)) throw new Error(`Lucide icon did not export node data: ${source}`);
  const geometry = iconModule.default.map(([tag, attributes]) => {
    const attrs = Object.entries({ ...attributes, fill: "none", stroke: "currentColor", "stroke-linecap": "round", "stroke-linejoin": "round" })
      .map(([name, value]) => `${name}="${String(value)}"`).join(" ");
    return `<${tag} ${attrs}/>`;
  }).join("");
  // Keep the symbol shape compatible with build-inline-icon-map.mjs. Provenance
  // stays in the semantic alias registry rather than adding attributes here.
  symbols.push(`    <symbol id="tui-${alias.replaceAll("/", "-")}" data-icon-alias="${alias}" data-icon-source="lucide@${aliasRegistry.lucideVersion}" data-icon-name="${source}" viewBox="0 0 24 24">${geometry}</symbol>`);
}
// Asset-sourced aliases are kept in the same canonical sprite as Lucide
// aliases. This prevents a future sprite rebuild from silently replacing a
// design-supplied mark with a generic check icon.
for (const [alias, definition] of Object.entries(aliasRegistry.aliases).filter(([, item]) => item.source === "asset")) {
  const assetPath = path.join(root, "skill-support", definition.path);
  const asset = await fs.readFile(assetPath, "utf8");
  const match = asset.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!match) throw new Error(`Invalid SVG asset for ${alias}: ${definition.path}`);
  const viewBox = match[1].match(/\bviewBox=["']([^"']+)["']/i)?.[1] ?? "0 0 24 24";
  symbols.push(`    <symbol id="tui-${alias.replaceAll("/", "-")}" data-icon-alias="${alias}" data-icon-source="asset" data-icon-path="${definition.path}" viewBox="${viewBox}">${match[2].trim()}</symbol>`);
}
const sprite = `<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"><defs>\n${symbols.join("\n")}\n</defs></svg>\n`;
await fs.writeFile(target, sprite);
for (const framework of ["components-react", "components-vue"]) await fs.copyFile(target, path.join(root, `packages/${framework}/src/component-icons.svg`));
console.log(`Generated ${symbols.length} canonical component icon symbols.`);
