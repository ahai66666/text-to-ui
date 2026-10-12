#!/usr/bin/env node

import assert from "node:assert/strict";
import { verifySkill } from "./skill-delivery.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const source = path.join(repository, "skill-support");
const mirrors = [
  { name: "repository skill mirror", root: path.join(repository, "skill") },
];
const installedRoot = process.env.TEXT_TO_UI_INSTALLED_SKILL_ROOT
  ?? path.join(os.homedir(), ".codex/skills/text-to-ui");
if (fs.existsSync(installedRoot)) mirrors.push({ name: "installed skill", root: installedRoot });
const digest = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
for (const mirror of mirrors) verifySkill(source, mirror.root);
const unifiedDelivery = process.env.TEXT_TO_UI_UNIFIED_PLUGIN_DELIVERY_ROOT
  ?? process.env.TEXT_TO_UI_PLUGIN_DELIVERY_ROOT
  ?? null;
if (unifiedDelivery && fs.existsSync(unifiedDelivery)) {
  for (const relative of [
    "main.js", "main.template.js", "pixso-native-execution-runtime.js", "manifest.json",
    "pixso-plugin-bridge.mjs", "pixso-capture-bundle.mjs", "pixso-official-adapter.mjs",
    "ui.html", "README.md", "permanent-agent-capabilities.json", "compatibility-matrix.json",
  ]) {
    const expected = path.join(source, "scripts/pixso-unified-agent-plugin", relative);
    const actual = path.join(unifiedDelivery, relative);
    assert.ok(fs.existsSync(actual), `unified plugin delivery is missing ${relative}`);
    assert.equal(digest(actual), digest(expected), `unified plugin delivery differs for ${relative}`);
  }
  assert.equal(
    digest(path.join(unifiedDelivery, "pixso-native-component-map.json")),
    digest(path.join(source, "assets/design-system/pixso-native-component-map.json")),
    "unified plugin delivery differs for component map",
  );
} else {
  console.log("Unified plugin delivery check skipped; set TEXT_TO_UI_PLUGIN_DELIVERY_ROOT to validate an external delivery copy.");
}
console.log(`Pixso delivery mirrors passed: ${mirrors.length} repository/installed skill mirror(s).`);
