#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readPageBlueprint } from "./page-blueprint.mjs";
import { readPageContentRecipes } from "./page-content-recipes.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
const recipesPath = valueFor('--recipes') ?? args.find((arg) => !arg.startsWith('--'));
const blueprintPath = valueFor('--blueprint');
if (!recipesPath || !blueprintPath) throw new Error('Usage: validate-page-content-recipes.mjs --recipes <page-content-recipes.json> --blueprint <page-blueprint.json> [--bindings <page-bindings.json>]');
const blueprint = readPageBlueprint(blueprintPath);
const bindings = valueFor('--bindings') ? JSON.parse(fs.readFileSync(path.resolve(valueFor('--bindings')), 'utf8')).componentBindings ?? [] : [];
readPageContentRecipes(recipesPath, { blueprint, bindings });
console.log(`Page content recipes valid: ${path.resolve(recipesPath)}`);
