#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-standalone-"));
const script = path.resolve("skill-support/scripts/scaffold-standalone-project.mjs");
const result = spawnSync(process.execPath, [script, "--project", temp, "--repo", process.cwd()], { encoding: "utf8" });
assert.equal(result.status, 0, result.stderr);
const root = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8"));
assert.equal(root.dependencies["@text-to-ui/components-html"], "file:vendor/@text-to-ui/components-html");
assert.equal(root.devDependencies.vite, "7.3.6");
assert.equal(root.scripts.verify, "node scripts/verify.mjs");
const htmlPackage = JSON.parse(fs.readFileSync(path.join(temp, "vendor/@text-to-ui/components-html/package.json"), "utf8"));
assert.equal(htmlPackage.dependencies["@text-to-ui/tokens"], "file:../tokens");
assert.equal(Object.values(htmlPackage.dependencies).some((value) => value === "workspace:*"), false);
assert.equal(fs.existsSync(path.join(temp, "scripts/verify.mjs")), true);
for (const file of ['index.html', 'main.js', 'vite.config.mjs']) assert.ok(fs.existsSync(path.join(temp, file)), `empty directory scaffold must create ${file}`);
assert.equal(fs.readFileSync(path.join(temp, "pnpm-workspace.yaml"), "utf8"), 'packages:\n  - "."\n');
const install = spawnSync("pnpm", ["install", "--ignore-scripts"], { cwd: temp, encoding: "utf8" });
assert.equal(install.status, 0, install.stderr || install.stdout);
fs.rmSync(temp, { recursive: true, force: true });
console.log("Standalone project scaffolding tests passed.");
