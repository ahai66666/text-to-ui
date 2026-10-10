#!/usr/bin/env node

import path from "node:path";
import { compileUiScene, loadComponentMap, loadTokenResources, readJson, writeJson } from "./ui-scene-lib.mjs";
import { parseArgs } from "./pixso-native-scene-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const usage = "Usage: compile-ui-scene.mjs --scene <ui-scene.json> --component-map <map.json> --pixso-scene-out <pixso-scene.json> --plan-out <pixso-operation-plan.json> [--token-dir <design-system>]";
if (args.help || !args.scene || !args["component-map"] || !args["pixso-scene-out"] || !args["plan-out"]) {
  if (!args.help) console.error(usage);
  process.exit(args.help ? 0 : 2);
}
const uiScene = readJson(args.scene);
const componentMap = loadComponentMap(args["component-map"]);
const tokens = loadTokenResources({ tokenDir: args["token-dir"] ? path.resolve(args["token-dir"]) : undefined });
const { pixsoScene, plan } = compileUiScene(uiScene, { componentMap, tokens });
writeJson(args["pixso-scene-out"], pixsoScene);
writeJson(args["plan-out"], plan);
console.log(JSON.stringify({ ok: true, uiScene: path.resolve(args.scene), pixsoScene: path.resolve(args["pixso-scene-out"]), plan: path.resolve(args["plan-out"]), ...plan.summary }, null, 2));
