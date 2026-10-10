#!/usr/bin/env node
import { readPageBlueprint } from "./page-blueprint.mjs";

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith("--"));
const patternIndex = args.indexOf("--pattern");
const patternId = patternIndex >= 0 ? args[patternIndex + 1] : undefined;
if (!file) throw new Error("Usage: validate-page-blueprint.mjs <page-blueprint.json> [--pattern <pattern-id>]");
const blueprint = readPageBlueprint(file, { patternId });
console.log(JSON.stringify({ ok: true, id: blueprint.id, pattern: blueprint.pattern.id }, null, 2));
