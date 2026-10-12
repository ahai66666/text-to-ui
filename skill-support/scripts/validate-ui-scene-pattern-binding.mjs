#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { normalizeUiScene } from "./ui-scene-core.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
const scenePath = valueFor("--scene");
const layoutPath = valueFor("--layout-contract");
if (!scenePath) throw new Error("Usage: validate-ui-scene-pattern-binding.mjs --scene <ui-scene.json> [--layout-contract <layout-contract.json>] [--require-slots]");
const read = (file) => JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const result = normalizeUiScene(read(scenePath), { layoutContract: layoutPath ? read(layoutPath) : null, requireSlots: args.includes("--require-slots") });
console.log(JSON.stringify({ ok: true, patternId: result.resolvedPattern.pattern.id, patternDigest: result.patternDigest, structureDigest: result.structureDigest }, null, 2));
