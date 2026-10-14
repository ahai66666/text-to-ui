#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "tui-compact-check-"));
const exported = path.join(temporary, "text-to-ui");
const project = path.join(temporary, "page");
const archive = path.join(temporary, "text-to-ui-skill-compact.zip");
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trim();
};
try {
  run(process.execPath, ["tools/export-compact-html.mjs", "--out", exported], repository);
  assert(fs.existsSync(path.join(exported, "packages/components-html/src/index.js")));
  assert(fs.existsSync(path.join(exported, "packages/pattern-runtime/src/index.js")));
  assert(!fs.existsSync(path.join(exported, "packages/components-react")));
  assert(!fs.existsSync(path.join(exported, "packages/components-vue")));
  assert(!fs.existsSync(path.join(exported, "assets/icons/harmonyos/source/HMSymbol.ttf")));
  assert(!fs.existsSync(path.join(exported, "assets/icons/harmonyos/source/layer-config.json")));
  run(process.execPath, ["scripts/scaffold-project.mjs", "--project", project], exported);
  run(process.execPath, ["scripts/generate-page.mjs", "--project", project, "--spec", path.join(exported, "examples/page-spec.json")], exported);
  run("pnpm", ["install"], project);
  run("pnpm", ["build"], project);
  assert(fs.existsSync(path.join(project, "dist/index.html")));
  run("zip", ["-q", "-r", archive, "text-to-ui"], temporary);
  const bytes = fs.statSync(archive).size;
  const limit = Math.floor(3.3 * 1024 * 1024);
  assert(bytes <= limit, `Compact ZIP is ${bytes} bytes; limit is ${limit}`);
  const provenance = JSON.parse(fs.readFileSync(path.join(exported, "PROVENANCE.json"), "utf8"));
  console.log(JSON.stringify({ ok: true, zipBytes: bytes, expandedBytes: provenance.expandedBytes, files: provenance.fileCount, sourceCommit: provenance.sourceCommit, builtPage: true }, null, 2));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
