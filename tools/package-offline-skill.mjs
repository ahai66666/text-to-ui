#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(fs.readFileSync(path.join(repository, "skill-support/package.json"), "utf8")).version;
const supported = new Set(["darwin-x64", "darwin-arm64", "win32-x64"]);
const target = `${process.platform}-${process.arch}`;
const checking = process.argv.includes("--check");
if (!supported.has(target)) throw new Error(`Unsupported offline package host ${target}`);
if (!checking && target !== "win32-x64") throw new Error("Only the Windows x64 offline bundle is a distributable target; use --check for a temporary host smoke test");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "tui-offline-package-"));
const stage = path.join(temporary, "stage");
const bundle = path.join(stage, "text-to-ui");
const archive = checking ? path.join(temporary, `text-to-ui-offline-v${version}-${target}.zip`) : path.join(repository, "release", `text-to-ui-offline-v${version}-${target}.zip`);
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const run = (command, args, cwd = repository) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.error?.message ?? result.stderr ?? result.stdout}`);
  return result.stdout.trim();
};
const powerShellQuote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const archiveWindows = (action, destination) => {
  const sevenZipArgs = action === "create" ? ["a", "-tzip", archive, "text-to-ui"] : ["x", archive, `-o${destination}`];
  const sevenZip = spawnSync("7z", sevenZipArgs, { cwd: action === "create" ? stage : destination, stdio: "ignore" });
  if (!sevenZip.error && sevenZip.status === 0) return;
  const script = action === "create"
    ? `Compress-Archive -LiteralPath ${powerShellQuote(bundle)} -DestinationPath ${powerShellQuote(archive)} -Force`
    : `Expand-Archive -LiteralPath ${powerShellQuote(archive)} -DestinationPath ${powerShellQuote(destination)} -Force`;
  run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], action === "create" ? stage : destination);
};
const excluded = new Set(["node_modules", "dist", "outputs", ".git", ".text-to-ui", "release", "skill", "__pycache__", ".DS_Store"]);
const copySource = (name) => {
  const source = path.join(repository, name);
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, path.join(bundle, name), { recursive: true, filter: (item) => !excluded.has(path.basename(item)) });
};
try {
  fs.mkdirSync(bundle, { recursive: true });
  for (const name of ["SKILL.md", "agents", "skill-support", "packages", "apps", "tools", "fixtures", "package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"]) copySource(name);
  const template = path.join(bundle, "offline-template");
  run(process.execPath, [path.join(bundle, "skill-support/scripts/scaffold-standalone-project.mjs"), "--project", template, "--repo", bundle]);
  run(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["install", "--config.node-linker=hoisted", "--no-frozen-lockfile"], template);
  const modules = path.join(template, "node_modules");
  assert(fs.existsSync(path.join(modules, "vite", "bin", "vite.js")), "Offline Vite dependencies were not installed");
  fs.renameSync(modules, path.join(bundle, "node_modules"));
  fs.rmSync(template, { recursive: true, force: true });
  const runtime = path.join(bundle, "runtime");
  fs.mkdirSync(runtime, { recursive: true });
  const nodeBinary = path.join(runtime, process.platform === "win32" ? "node.exe" : "node");
  fs.copyFileSync(process.execPath, nodeBinary);
  if (process.platform !== "win32") fs.chmodSync(nodeBinary, 0o755);
  fs.copyFileSync(path.join(bundle, "tools", "offline-start.sh"), path.join(bundle, "text-to-ui.sh"));
  fs.copyFileSync(path.join(bundle, "tools", "offline-start.cmd"), path.join(bundle, "text-to-ui.cmd"));
  if (process.platform !== "win32") fs.chmodSync(path.join(bundle, "text-to-ui.sh"), 0o755);
  fs.writeFileSync(path.join(bundle, "offline-runtime.json"), `${JSON.stringify({ schemaVersion: 1, version, platform: process.platform, arch: process.arch, nodeVersion: process.versions.node, nodeDigest: hash(nodeBinary), registryDigest: hash(path.join(bundle, "packages/component-contracts/src/components.json")) }, null, 2)}\n`);
  run(nodeBinary, [path.join(bundle, "skill-support/scripts/offline-runner.mjs"), "doctor"], bundle);
  const previewProject = path.join(temporary, "离线 项目");
  run(nodeBinary, [path.join(bundle, "skill-support/scripts/offline-runner.mjs"), "new-project", previewProject], bundle);
  assert(fs.existsSync(path.join(previewProject, "node_modules", "vite", "bin", "vite.js")), "Offline project did not receive prepared dependencies");
  assert(fs.existsSync(path.join(previewProject, "vendor", "@text-to-ui", "components-html", "src", "index.js")), "Offline project did not receive component source");
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  if (fs.existsSync(archive)) fs.rmSync(archive);
  if (process.platform === "win32") archiveWindows("create", stage);
  else run("zip", ["-q", "-r", archive, "text-to-ui"], stage);
  const extracted = path.join(temporary, "extracted");
  fs.mkdirSync(extracted);
  if (process.platform === "win32") archiveWindows("extract", extracted);
  else run("unzip", ["-q", archive, "-d", extracted], extracted);
  const unpacked = path.join(extracted, "text-to-ui");
  assert(fs.existsSync(path.join(unpacked, "SKILL.md")) && fs.existsSync(path.join(unpacked, "packages", "components-vue", "src", "index.js")));
  run(path.join(unpacked, "runtime", process.platform === "win32" ? "node.exe" : "node"), [path.join(unpacked, "skill-support/scripts/offline-runner.mjs"), "doctor"], unpacked);
  run(process.execPath, [path.join(repository, "tools/test-offline-bundle.mjs"), "--bundle", unpacked, "--browser-required"], repository);
  const digest = hash(archive);
  if (!checking) fs.writeFileSync(`${archive}.sha256`, `${digest}  ${path.basename(archive)}\n`);
  console.log(JSON.stringify({ ok: true, archive, sha256: digest, bytes: fs.statSync(archive).size, target, checkedExtractedRuntime: true }, null, 2));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
