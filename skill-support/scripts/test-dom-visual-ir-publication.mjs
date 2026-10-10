#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scripts);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-dom-publication-"));
const htmlRoot = path.join(temporary, "html");
const runsRoot = path.join(temporary, "runs");
fs.mkdirSync(htmlRoot, { recursive: true });
fs.writeFileSync(path.join(htmlRoot, "index.html"), "<!doctype html><main id=app>Publication fixture</main>\n");

function writePngHeader(file, width, height) {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.writeUInt32BE(13, 8);
  png.write("IHDR", 12, "ascii");
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  fs.writeFileSync(file, png);
}

const create = spawnSync(process.execPath, [path.join(scripts, "create-pixso-import-run.mjs"), "--html-root", htmlRoot, "--url", "http://127.0.0.1:43173/fixture/", "--runs-root", runsRoot, "--mode", "normal"], { encoding: "utf8" });
assert.equal(create.status, 0, create.stderr);
const created = JSON.parse(create.stdout);
const runManifest = JSON.parse(fs.readFileSync(created.manifest, "utf8"));
const style = {
  display: "block", visibility: "visible", position: "static", overflow: "hidden", overflowX: "hidden", overflowY: "hidden",
  backgroundColor: "rgb(255, 255, 255)", backgroundImage: "none", color: "rgb(0, 0, 0)", opacity: "1", boxShadow: "none",
  borderTopWidth: "0px", borderRightWidth: "0px", borderBottomWidth: "0px", borderLeftWidth: "0px",
  borderTopStyle: "none", borderRightStyle: "none", borderBottomStyle: "none", borderLeftStyle: "none",
  borderTopColor: "rgba(0, 0, 0, 0)", borderRightColor: "rgba(0, 0, 0, 0)", borderBottomColor: "rgba(0, 0, 0, 0)", borderLeftColor: "rgba(0, 0, 0, 0)",
  borderTopLeftRadius: "0px", borderTopRightRadius: "0px", borderBottomRightRadius: "0px", borderBottomLeftRadius: "0px",
  paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
  fontFamily: "HarmonyOS Sans", fontSize: "16px", fontWeight: "400", lineHeight: "22px", textAlign: "start", textOverflow: "clip"
};
const visualManifest = {
  schemaVersion: 4,
  kind: "text-to-ui-html-visual-manifest",
  source: "browser-computed-visual-manifest",
  runId: runManifest.runId,
  htmlSourceFingerprint: runManifest.source.htmlSourceFingerprint,
  stateId: "default-visible",
  url: runManifest.source.url,
  viewport: { width: 1728, height: 1152, devicePixelRatio: 1, zoom: 1 },
  nodeCount: 1,
  nodes: [{ index: 0, parentIndex: null, childIndex: 0, selector: "#app", selectorAliases: ["#app"], tag: "main", rect: { x: 0, y: 0, width: 1728, height: 1152 }, style, semantic: { dataset: {}, component: null }, text: "", asset: null }]
};
fs.writeFileSync(runManifest.artifacts.visualManifest, `${JSON.stringify(visualManifest, null, 2)}\n`);
writePngHeader(runManifest.artifacts.htmlScreenshot, runManifest.viewport.width, runManifest.viewport.height);
const capture = spawnSync(process.execPath, [path.join(scripts, "pixso-import-orchestrator.mjs"), "capture", "--run-manifest", created.manifest], { encoding: "utf8" });
assert.equal(capture.status, 0, capture.stderr);
const compile = spawnSync(process.execPath, [path.join(scripts, "compile-pixso-import.mjs"), "--run-manifest", created.manifest, "--visual-manifest", runManifest.artifacts.visualManifest, "--component-map", path.join(skillRoot, "assets/design-system/pixso-native-component-map.json")], { encoding: "utf8" });
assert.equal(compile.status, 0, compile.stderr);
const plan = JSON.parse(fs.readFileSync(runManifest.artifacts.operationPlan, "utf8"));
assert.equal(plan.page.htmlSourceFingerprint, runManifest.source.htmlSourceFingerprint);
assert.equal(plan.page.visualSnapshot.htmlSourceFingerprint, runManifest.source.htmlSourceFingerprint);
const preflight = spawnSync(process.execPath, [path.join(scripts, "pixso-import-orchestrator.mjs"), "preflight", "--run-manifest", created.manifest], { encoding: "utf8" });
assert.equal(preflight.status, 0, preflight.stderr || preflight.stdout);

const port = 47000 + Math.floor(Math.random() * 500);
const bridgeStateDirectory = path.join(temporary, "bridge");
const env = { ...process.env, TEXT_TO_UI_PIXSO_BRIDGE_PORT: String(port), TEXT_TO_UI_PIXSO_BRIDGE_STATE_DIR: bridgeStateDirectory };
const bridge = spawn(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "serve"], { env, stdio: "ignore" });
const waitForBridge = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return true; } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
};
try {
  assert.equal(await waitForBridge(), true, "test bridge did not start");
  await fetch(`http://127.0.0.1:${port}/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: "publication-test", revision: "", runtimeVersion: "5.0.0", kernelVersion: "5.0.0", protocolVersion: 4, operationPlanVersions: [1, 5], capabilities: plan.execution.agentContract.requiredCapabilities }) });
  const publish = spawnSync(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "publish", runManifest.artifacts.operationPlan], { env, encoding: "utf8" });
  assert.equal(publish.status, 0, publish.stderr);
  assert.equal(JSON.parse(publish.stdout).ok, true);
} finally {
  bridge.kill("SIGTERM");
  fs.rmSync(temporary, { recursive: true, force: true });
}
console.log("DOM Visual IR publication test passed: compiler stamps page fingerprints and Bridge accepts the current plan.");
