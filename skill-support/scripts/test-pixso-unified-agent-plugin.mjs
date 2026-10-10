#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plugin = path.join(sourceRoot, "scripts/pixso-unified-agent-plugin");
const manifest = JSON.parse(fs.readFileSync(path.join(plugin, "manifest.json"), "utf8"));
const componentMap = JSON.parse(fs.readFileSync(path.join(sourceRoot, "assets/design-system/pixso-native-component-map.json"), "utf8"));
const main = fs.readFileSync(path.join(plugin, "main.js"), "utf8");
const template = fs.readFileSync(path.join(plugin, "main.template.js"), "utf8");
const ui = fs.readFileSync(path.join(plugin, "ui.html"), "utf8");
const builder = fs.readFileSync(path.join(sourceRoot, "scripts/build-pixso-unified-agent-plugin.mjs"), "utf8");

assert.equal(manifest.id, "text-to-ui-pixso-agent-v2");
assert.equal(manifest.ui, "./ui.html");
assert.ok(manifest.menu.some((item) => item.command === "open"));
assert.ok(manifest.menu.some((item) => item.command === "sync"));
assert.ok(manifest.menu.some((item) => item.command === "health"));
assert.match(template, /__TUI_COMPONENT_SYNC_CORE__/);
assert.match(builder, /EMBEDDABLE_COMPONENT_SYNC_CORE/);
assert.match(main, /TextToUiComponentSync\.readComponentFacts/);
assert.match(main, /message\.type === "SYNC_COMPONENTS"/);
assert.match(main, /message\.type === "AUTO_PLAN"/);
assert.match(template, /checkpointInterval: 5/);
assert.match(main, /message\.type === "CANCEL_GENERATION"/);
assert.match(main, /iconColorSource === "variant-content"/);
assert.match(main, /variantContentPaintSource/);
assert.equal(componentMap.projectionKind, "generated-compatibility-projection");
assert.equal(componentMap.readOnly, true);
assert.match(main, /allowContentColorOverride/);
assert.doesNotMatch(main, /applyInstanceContentColor\(node, operation\.componentRef\?\.contentColor\)/);
assert.match(ui, /id="sync-components"/);
assert.match(ui, /id="open"/);
assert.match(ui, /id="reset-import"/);
assert.match(ui, /ignoreRunningState/);
assert.match(ui, /\/component-sync/);
assert.match(ui, /AUTO_PLAN_RESULT/);
for (const match of ui.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(match[1]);
assert.equal(new Set(manifest.menu.map((item) => item.command)).size, manifest.menu.length);
console.log("Pixso unified agent plugin test passed: import, component sync, and service health share one entry point.");
