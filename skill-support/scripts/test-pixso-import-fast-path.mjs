#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-fast-import-"));
const htmlRoot = path.join(temporary, "html");
const runsRoot = path.join(temporary, "runs");
fs.mkdirSync(htmlRoot, { recursive: true });
fs.writeFileSync(path.join(htmlRoot, "index.html"), "<!doctype html><main>Fast import fixture</main>\n");

function writePngHeader(file, width, height) {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.writeUInt32BE(13, 8);
  png.write("IHDR", 12, "ascii");
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  fs.writeFileSync(file, png);
}

const create = spawnSync(process.execPath, [
  path.join(scripts, "create-pixso-import-run.mjs"),
  "--html-root", htmlRoot,
  "--url", "http://127.0.0.1:43173/fixture/",
  "--runs-root", runsRoot,
  "--mode", "normal"
], { encoding: "utf8" });
assert.equal(create.status, 0, create.stderr);
const created = JSON.parse(create.stdout);
const concurrentCreate = spawnSync(process.execPath, [
  path.join(scripts, "create-pixso-import-run.mjs"),
  "--html-root", htmlRoot,
  "--url", "http://127.0.0.1:43173/fixture/",
  "--runs-root", runsRoot,
  "--mode", "normal"
], { encoding: "utf8" });
assert.notEqual(concurrentCreate.status, 0, "a second active run must not replace current-run.json");
assert.match(concurrentCreate.stderr, /Another Pixso import run is active/);
const manifest = JSON.parse(fs.readFileSync(created.manifest, "utf8"));
assert.equal(manifest.executionPolicy.mode, "normal");
assert.equal(manifest.executionPolicy.attemptLimits.capture, 1);
assert.equal(manifest.executionPolicy.budgetsMs.total, 90000);
assert.equal(manifest.executionPolicy.executorRouting, "plugin-required-mcp-explicit-only");
assert.equal(manifest.executionPolicy.outputPolicy, "single-managed-artboard");
assert.equal(manifest.executionPolicy.visualBaseline, "disabled-use-current-browser-screenshot");
assert.equal(manifest.executionPolicy.pixsoWrite, "single-transaction");
assert.equal(manifest.executionPolicy.captureBundle, "required");
assert.ok(manifest.artifacts.captureBundle);
assert.equal(manifest.timing.startedAt, null);
assert.equal(manifest.telemetry.codeToDesignCalls, 0);
assert.equal("visualBaselinePackage" in manifest.artifacts, false);
assert.equal("diagnosticVisualBaselinePackage" in manifest.artifacts, false);

const blockedLegacyCompile = spawnSync(process.execPath, [
  path.join(scripts, "compile-pixso-import.mjs"),
  "--run-manifest", created.manifest,
  "--visual-manifest", path.join(htmlRoot, "visual-manifest.json"),
  "--component-map", path.join(htmlRoot, "component-map.json"),
  "--pipeline", "legacy-semantic"
], { encoding: "utf8" });
assert.notEqual(blockedLegacyCompile.status, 0, "normal imports must never enter the legacy semantic compiler");
assert.match(blockedLegacyCompile.stderr, /legacy-semantic is diagnostic-only/);

const update = (stage, status, extra = []) => spawnSync(process.execPath, [
  path.join(scripts, "update-pixso-import-run.mjs"),
  "--manifest", created.manifest,
  "--stage", stage,
  "--status", status,
  ...extra
], { encoding: "utf8" });
assert.equal(update("capture", "start").status, 0);
const captureVisualManifest = {
  schemaVersion: 4,
  kind: "text-to-ui-html-visual-manifest",
  source: "browser-computed-visual-manifest",
  runId: manifest.runId,
  htmlSourceFingerprint: manifest.source.htmlSourceFingerprint,
  stateId: manifest.viewport.stateId,
  viewport: { width: manifest.viewport.width, height: manifest.viewport.height, devicePixelRatio: 1, zoom: 1 },
  nodeCount: 1,
  nodes: [{ selector: "#app", rect: { width: manifest.viewport.width, height: manifest.viewport.height }, style: { display: "grid" } }],
};
fs.writeFileSync(manifest.artifacts.visualManifest, `${JSON.stringify(captureVisualManifest, null, 2)}\n`);
writePngHeader(manifest.artifacts.htmlScreenshot, manifest.viewport.width, manifest.viewport.height);
const captureCommit = spawnSync(process.execPath, [
  path.join(scripts, "pixso-capture-bundle.mjs"),
  "--run-manifest", created.manifest,
], { encoding: "utf8" });
assert.equal(captureCommit.status, 0, captureCommit.stderr);
assert.equal(update("capture", "passed", ["--metrics", JSON.stringify({ actualWorkMs: 5 })]).status, 0);
const updatedManifest = JSON.parse(fs.readFileSync(created.manifest, "utf8"));
assert.ok(updatedManifest.timing.startedAt, "active timing must begin with the first stage, not run-directory creation");
assert.equal(updatedManifest.timing.stages.capture.workElapsedMs, 5);
assert.equal(updatedManifest.gates.captureBundle, "passed");
const baselineInNormalMode = update("baseline", "start");
assert.notEqual(baselineInNormalMode.status, 0, "normal mode must reject code-to-design baseline work");
assert.match(baselineInNormalMode.stderr, /Baseline is disabled in normal mode/);
const repeatedCapture = update("capture", "start");
assert.notEqual(repeatedCapture.status, 0, "normal mode must reject a repeated capture");
assert.match(repeatedCapture.stderr, /repeated work requires a new run or diagnostic mode/);
const cancelled = spawnSync(process.execPath, [
  path.join(scripts, "pixso-import-orchestrator.mjs"), "cancel",
  "--runs-root", runsRoot,
  "--reason", "test replacement"
], { encoding: "utf8" });
assert.equal(cancelled.status, 0, cancelled.stderr);
assert.equal(JSON.parse(cancelled.stdout).status, "cancelled");
const replacementCreate = spawnSync(process.execPath, [
  path.join(scripts, "create-pixso-import-run.mjs"),
  "--html-root", htmlRoot,
  "--url", "http://127.0.0.1:43173/fixture/",
  "--runs-root", runsRoot,
  "--mode", "normal"
], { encoding: "utf8" });
assert.equal(replacementCreate.status, 0, replacementCreate.stderr);

const port = 45000 + Math.floor(Math.random() * 1000);
const bridgeStateDirectory = path.join(os.tmpdir(), `text-to-ui-pixso-bridge-${port}`);
fs.mkdirSync(bridgeStateDirectory, { recursive: true });
fs.writeFileSync(path.join(bridgeStateDirectory, "current-plan.json"), `${JSON.stringify({
  kind: "pixso-operation-plan",
  page: { htmlSourceFingerprint: "legacy", visualSnapshot: { source: "html-live-computed-style", htmlSourceFingerprint: "legacy" } },
  execution: { sourcePolicy: "fresh-build-current-html-no-history" },
  operations: []
}, null, 2)}\n`);
const bridge = spawn(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "serve"], {
  env: { ...process.env, TEXT_TO_UI_PIXSO_BRIDGE_PORT: String(port), TEXT_TO_UI_PIXSO_BRIDGE_STATE_DIR: bridgeStateDirectory },
  stdio: "ignore"
});
const waitFor = async (predicate, attempts = 40) => {
  for (let index = 0; index < attempts; index += 1) {
    try { if (await predicate()) return true; } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
};
try {
  assert.equal(await waitFor(async () => (await fetch(`http://127.0.0.1:${port}/health`)).ok), true, "bridge did not start");
  const health = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
  assert.equal(health.protocolVersion, 4);
  assert.equal(health.minimumPluginRuntimeVersion, "4.16");
  assert.equal(health.preferredKernelVersion, "5.0.0");
  assert.equal(health.officialAdapterVersion, 1);
  assert.equal(health.executionModel.mode, "installed-permanent-executor");
  assert.equal(health.executionModel.executorProtocol, 1);
  assert.equal(health.executionModel.codeDelivery, "none");
  const statusBefore = spawnSync(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "status"], {
    env: { ...process.env, TEXT_TO_UI_PIXSO_BRIDGE_PORT: String(port), TEXT_TO_UI_PIXSO_BRIDGE_STATE_DIR: bridgeStateDirectory }, encoding: "utf8"
  });
  assert.equal(statusBefore.status, 0, statusBefore.stderr);
  assert.equal(JSON.parse(statusBefore.stdout).recommendedExecutor, "plugin");
  await fetch(`http://127.0.0.1:${port}/session?session=test-plugin&revision=fixture`);
  const statusAfter = spawnSync(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "status"], {
    env: { ...process.env, TEXT_TO_UI_PIXSO_BRIDGE_PORT: String(port), TEXT_TO_UI_PIXSO_BRIDGE_STATE_DIR: bridgeStateDirectory }, encoding: "utf8"
  });
  assert.equal(statusAfter.status, 0, statusAfter.stderr);
  const connected = JSON.parse(statusAfter.stdout);
  assert.equal(connected.connected, true);
  assert.equal(connected.recommendedExecutor, "plugin", "normal whole-page imports must keep the native plugin as the required executor");
  const staleClaim = await (await fetch(`http://127.0.0.1:${port}/claim`)).json();
  assert.equal(staleClaim.blocked, true, "bridge must not serve a stale publication left in its state directory");
  assert.equal(staleClaim.changed, false);
  assert.equal(staleClaim.cleared, true, "stale publications must be removed from the active queue");
  const currentPlanPath = path.join(temporary, "current-component-library-plan.json");
  fs.writeFileSync(currentPlanPath, `${JSON.stringify({
    kind: "pixso-component-library-plan",
    page: { name: "NewComponents" },
    execution: { mode: "component-library", minimumRuntimeVersion: "4.16" },
    operations: []
  }, null, 2)}\n`);
  const queuedPublish = spawnSync(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "publish", currentPlanPath], {
    env: { ...process.env, TEXT_TO_UI_PIXSO_BRIDGE_PORT: String(port), TEXT_TO_UI_PIXSO_BRIDGE_STATE_DIR: bridgeStateDirectory }, encoding: "utf8"
  });
  assert.equal(queuedPublish.status, 0, queuedPublish.stderr);
  assert.equal(JSON.parse(queuedPublish.stdout).queued, true, "disconnected publication must wait in the durable plugin queue");
  await fetch(`http://127.0.0.1:${port}/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: "ready-plugin", revision: "fixture", runtimeVersion: "5.0.0", kernelVersion: "5.0.0", protocolVersion: 4, operationPlanVersions: [1, 5], capabilities: [] }) });
  const pluginPublished = spawnSync(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "publish", currentPlanPath], {
    env: { ...process.env, TEXT_TO_UI_PIXSO_BRIDGE_PORT: String(port), TEXT_TO_UI_PIXSO_BRIDGE_STATE_DIR: bridgeStateDirectory }, encoding: "utf8"
  });
  assert.equal(pluginPublished.status, 0, pluginPublished.stderr);
  const pluginPublishedPayload = JSON.parse(pluginPublished.stdout);
  assert.equal(pluginPublishedPayload.reused, true, "the same idempotency key must not create a second job");
  const pluginClaim = await (await fetch(`http://127.0.0.1:${port}/claim?after=&session=ready-plugin&runtime=5.0.0&protocol=4`)).json();
  assert.equal(pluginClaim.blocked, undefined);
  assert.equal(pluginClaim.changed, true, "a current plugin must receive a plugin-routed publication");
  assert.ok(pluginClaim.claimToken, "claim must reserve a lease instead of starting execution");
  assert.equal(pluginClaim.plan.kind, "pixso-component-library-plan");
  const claimedJob = await (await fetch(`http://127.0.0.1:${port}/job`)).json();
  assert.equal(claimedJob.job.status, "claimed");
  const oldMinimumPlanPath = path.join(temporary, "old-minimum-plan.json");
  fs.writeFileSync(oldMinimumPlanPath, `${JSON.stringify({
    kind: "pixso-component-library-plan",
    page: { name: "OldMinimum" },
    execution: { mode: "component-library", minimumRuntimeVersion: "4.13" },
    operations: []
  }, null, 2)}\n`);
  const oldMinimumPublished = spawnSync(process.execPath, [path.join(scripts, "pixso-plugin-bridge.mjs"), "publish", oldMinimumPlanPath], {
    env: { ...process.env, TEXT_TO_UI_PIXSO_BRIDGE_PORT: String(port), TEXT_TO_UI_PIXSO_BRIDGE_STATE_DIR: bridgeStateDirectory }, encoding: "utf8"
  });
  assert.equal(oldMinimumPublished.status, 0, oldMinimumPublished.stderr);
  const oldMinimumPayload = JSON.parse(oldMinimumPublished.stdout);
  assert.equal(oldMinimumPayload.requiredRuntimeVersion, "4.16", "an old plan must not lower the installed runtime contract");
  const serviceStatus = await (await fetch(`http://127.0.0.1:${port}/service-status`)).json();
  assert.equal(serviceStatus.service, "text-to-ui-pixso-service");
  assert.equal(serviceStatus.plugin.ready, true);
  assert.equal(serviceStatus.publication.publicationId, oldMinimumPayload.jobId);
  assert.ok(["queued", "queued-awaiting-plugin"].includes(serviceStatus.job.status));
  assert.equal(serviceStatus.officialAdapter.route.executor, "text-to-ui-native-plugin");
  assert.deepEqual(serviceStatus.officialAdapter.acceptance.calls.map((call) => call.tool), ["check_layout", "query_all_unique_props", "take_screenshot"]);
} finally {
  bridge.kill("SIGTERM");
  fs.rmSync(bridgeStateDirectory, { recursive: true, force: true });
  fs.rmSync(temporary, { recursive: true, force: true });
}

console.log("Pixso fast import tests passed: baseline-free normal mode, durable plugin queue, stale isolation, idempotency, and legacy-plan compatibility are deterministic.");
