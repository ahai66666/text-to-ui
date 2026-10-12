#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { compileOperationPlan, loadComponentMap, loadTokenResources, readJson } from "./pixso-native-scene-lib.mjs";
import { buildCoremailScene } from "./coremail-semantic-adapter.mjs";

const repo = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-pixso-mcp-"));
const output = path.join(temporary, "calls.json");
const fixtureRoot = path.join(repo, "fixtures/mail-workbench-native-scene");
const pageDataPath = path.join(fixtureRoot, "page-data.json");
const pageSpec = readJson(path.join(fixtureRoot, "page-spec.json"));
const layoutContract = readJson(path.join(fixtureRoot, "layout-contract.json"));
const pageData = readJson(pageDataPath);
const visualSnapshot = readJson(path.join(fixtureRoot, "html-visual-snapshot.json"));
const componentMap = loadComponentMap(path.join(repo, "skill-support/assets/design-system/pixso-native-component-map.json"));
const tokens = loadTokenResources();
const scene = buildCoremailScene({ pageSpec, layoutContract, pageData, componentMap, visualSnapshot, tokens, assetBaseDir: fixtureRoot });
const plan = path.join(temporary, "operation-plan.json");
fs.writeFileSync(plan, JSON.stringify(compileOperationPlan(scene, { componentMap, tokens })));
execFileSync(process.execPath, [path.join(repo, "skill-support/scripts/prepare-pixso-mcp-batches.mjs"), "--plan", plan, "--out", output], { stdio: "pipe" });
const calls = readJson(output);

assert.equal(calls.kind, "pixso-mcp-eval-call-plan");
assert.ok(calls.callCount > 1, "large plans must be split for Pixso MCP");
assert.equal(calls.calls.at(-1).phase, "readback");
assert.deepEqual(calls.modules.map((module) => module.id), ["shell", "primary-navigation", "secondary-list", "main-detail", "icon-hydration", "image-optimization"]);
assert.equal(calls.modules.reduce((sum, module) => sum + module.operationCount, 0), readJson(plan).operations.length, "module operation counts must cover the complete current Coremail plan");
assert.ok(calls.calls.every((call) => call.tool === "eval_script"));
assert.ok(calls.calls.every((call) => call.bytes <= calls.maximumScriptBytes));
assert.ok(calls.calls.every((call) => call.arguments.script.includes("TextToUiPixsoRuntime")));
assert.ok(calls.calls.every((call) => !call.arguments.script.includes("code_to_design")));
assert.ok(calls.calls.at(-1).arguments.script.includes("executor.verify(plan)"));
const createCalls = calls.calls.filter((call) => call.phase !== "readback");
assert.ok(createCalls.every((call) => call.arguments.script.includes("executor.execute(plan,")));
assert.ok(createCalls.some((call) => call.arguments.script.includes("brand/harmony-mail-logo") && call.arguments.script.includes("dataBase64")), "image bytes must travel with the module that creates the image node");
assert.ok(createCalls.every((call) => !call.arguments.script.includes("pixso.createNodeFromSvg") && !call.arguments.script.includes("pixso.createComponentFromNode")), "MCP scripts must not use the S_Guid-prone SVG/component conversion APIs");
assert.equal(createCalls.at(-1).commitReplacement, true, "only the final icon module may commit the replacement artboard");
assert.ok(createCalls.slice(0, -1).every((call) => call.commitReplacement === false), "intermediate modules must remain transactional checkpoints");
fs.rmSync(temporary, { recursive: true, force: true });
console.log(`Pixso MCP call-plan tests passed: ${calls.callCount - 1} create batches plus readback.`);
