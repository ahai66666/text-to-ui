#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { resolveComponentSelection, validateComponentSelection } from "./component-selection.mjs";

const args = process.argv.slice(2);
const value = (name) => { const index = args.indexOf(`--${name}`); return index < 0 ? null : args[index + 1]; };
const repo = path.resolve(value("repo") ?? process.cwd());
const contextPath = value("context");
const bindingsPath = value("bindings");
const output = value("out");
if (!contextPath || !bindingsPath || !output) throw new Error("Usage: resolve-component-selection.mjs --repo <repo> --context <context.json> --bindings <page-bindings.json> [--recipes <page-content-recipes.json>] --out <component-selection.json> [--check]");
const inputs = { repo, contextPath: path.resolve(contextPath), bindingsPath: path.resolve(bindingsPath), recipesPath: value("recipes") ? path.resolve(value("recipes")) : null };
if (args.includes("--check")) {
  validateComponentSelection(JSON.parse(fs.readFileSync(output, "utf8")), inputs);
  console.log(JSON.stringify({ ok: true, receipt: path.resolve(output) }));
} else {
  const receipt = resolveComponentSelection(inputs);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ receipt: path.resolve(output), decisions: receipt.entries.map(({ id, decision }) => ({ id, decision })) }, null, 2));
}
