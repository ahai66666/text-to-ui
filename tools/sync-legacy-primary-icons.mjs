#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIconSymbol, loadIconRegistry } from "../skill-support/scripts/icon-tools.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "skill-support/preview/component-gallery.html");
const aliases = [
  "navigation/grid",
  "field/calendar",
  "navigation/contacts",
  "navigation/mail-unread",
  "object/device"
];
const legacyIds = ["hmos-grid-fill", "hmos-document-fill", "hmos-users-fill", "hmos-message-fill", "hmos-device"];
const legacyPrimarySymbolIds = [
  "icon-primary-level-overview",
  "icon-primary-level-calendar",
  "icon-primary-level-contacts",
  "icon-primary-level-mail"
];
const registry = await loadIconRegistry();
let html = await fs.readFile(file, "utf8");

for (const id of legacyIds) {
  html = html.replace(new RegExp(`\\s*<symbol id="${id}"[\\s\\S]*?<\\/symbol>`, "g"), "");
}
for (const id of legacyPrimarySymbolIds) {
  html = html.replace(new RegExp(`\\s*<symbol id="${id}"[\\s\\S]*?<\\/symbol>`, "g"), "");
}
for (const alias of aliases) {
  const id = `icon-${alias.replaceAll("/", "-")}`;
  html = html.replace(new RegExp(`\\s*<symbol id="${id}"[\\s\\S]*?<\\/symbol>`, "g"), "");
}

const symbols = (await Promise.all(aliases.map((alias) => buildIconSymbol(alias, registry)))).join("\n");
html = html.replace(/(<svg class="hmos-sprite"[^>]*>)/, `$1\n${symbols}`);
const replacements = new Map([
  ["hmos-grid-fill", "icon-navigation-grid"],
  ["hmos-document-fill", "icon-field-calendar"],
  ["hmos-users-fill", "icon-navigation-contacts"],
  ["hmos-message-fill", "icon-navigation-mail-unread"],
  ["icon-primary-level-overview", "icon-navigation-grid"],
  ["icon-primary-level-calendar", "icon-field-calendar"],
  ["icon-primary-level-contacts", "icon-navigation-contacts"],
  ["icon-primary-level-mail", "icon-navigation-mail-unread"],
  ["hmos-device", "icon-object-device"]
]);
for (const [legacyId, id] of replacements) {
  html = html.replaceAll(`#${legacyId}`, `#${id}`);
  html = html.replaceAll(`<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${legacyId}"/></svg>`, `<svg class="pattern-lucide-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`);
}
html = html.replace("一级导航图标（专用面型）", "一级导航图标（Lucide Regular 线性）").replace("一级导航图标（组件专属面型）", "一级导航图标（Lucide Regular 线性）");
await fs.writeFile(file, html);
console.log(`Synchronized ${aliases.length} legacy primary-navigation icons to the Lucide Regular line rule.`);
