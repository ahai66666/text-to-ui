#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const runtime = fs.readFileSync(path.join(scripts, "pixso-native-execution-runtime.js"), "utf8").trim();
const template = fs.readFileSync(path.join(scripts, "pixso-native-renderer-plugin/main.template.js"), "utf8");
if (!template.includes("__TUI_PIXSO_RUNTIME__")) throw new Error("Plugin template is missing runtime marker");
const output = template.replace("__TUI_PIXSO_RUNTIME__", runtime);
const target = path.join(scripts, "pixso-native-renderer-plugin/main.js");
fs.writeFileSync(target, output);
const runtimeTarget = path.join(scripts, "pixso-native-renderer-plugin/pixso-native-execution-runtime.js");
fs.copyFileSync(path.join(scripts, "pixso-native-execution-runtime.js"), runtimeTarget);
const bridgeTarget = path.join(scripts, "pixso-native-renderer-plugin/pixso-plugin-bridge.mjs");
fs.copyFileSync(path.join(scripts, "pixso-plugin-bridge.mjs"), bridgeTarget);
const captureBundleTarget = path.join(scripts, "pixso-native-renderer-plugin/pixso-capture-bundle.mjs");
fs.copyFileSync(path.join(scripts, "pixso-capture-bundle.mjs"), captureBundleTarget);
const officialAdapterTarget = path.join(scripts, "pixso-native-renderer-plugin/pixso-official-adapter.mjs");
fs.copyFileSync(path.join(scripts, "pixso-official-adapter.mjs"), officialAdapterTarget);
const componentMapTarget = path.join(scripts, "pixso-native-renderer-plugin/pixso-native-component-map.json");
fs.copyFileSync(path.join(scripts, "../assets/design-system/pixso-native-component-map.json"), componentMapTarget);
for (const protocolFile of ["permanent-agent-capabilities.json", "compatibility-matrix.json"]) {
  fs.copyFileSync(path.join(scripts, "../protocol", protocolFile), path.join(scripts, "pixso-native-renderer-plugin", protocolFile));
}
console.log(JSON.stringify({ ok: true, target, runtimeTarget, bridgeTarget, captureBundleTarget, officialAdapterTarget, runtimeBytes: Buffer.byteLength(runtime), outputBytes: Buffer.byteLength(output) }, null, 2));
