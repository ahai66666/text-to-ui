#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(repo, "offline-runtime.json");
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const command = process.argv[2];
const args = process.argv.slice(3);
const file = (...parts) => path.join(repo, ...parts);
const run = (script, scriptArgs, cwd = repo) => {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], { cwd, stdio: "inherit" });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
};
const doctor = () => {
  if (!fs.existsSync(manifestPath)) throw new Error("This is a rules-only Skill, not a verified offline bundle");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.platform !== process.platform || manifest.arch !== process.arch) throw new Error(`Wrong offline bundle: expected ${manifest.platform}/${manifest.arch}, running ${process.platform}/${process.arch}`);
  for (const required of ["SKILL.md", "pnpm-workspace.yaml", "packages/component-contracts/src/components.json", "packages/components-html/src/index.js", "packages/components-react/src/index.jsx", "packages/components-vue/src/index.js", "node_modules/vite/bin/vite.js"]) {
    if (!fs.existsSync(file(required))) throw new Error(`Offline bundle is incomplete: ${required}`);
  }
  const sourceFork = fs.existsSync(file(".text-to-ui-source-fork.json"));
  if (!sourceFork && hash(file("packages/component-contracts/src/components.json")) !== manifest.registryDigest) throw new Error("Offline component registry hash mismatch");
  if (hash(process.execPath) !== manifest.nodeDigest) throw new Error("Offline Node runtime hash mismatch");
  return manifest;
};
const copyProjectPackages = (project) => {
  const vendor = path.join(project, "vendor", "@text-to-ui");
  const installed = path.join(project, "node_modules", "@text-to-ui");
  if (!fs.existsSync(vendor) || !fs.existsSync(installed)) throw new Error("Project is not an offline Text-to-UI project; run new-project first");
  for (const name of fs.readdirSync(vendor)) {
    const source = path.join(vendor, name);
    const target = path.join(installed, name);
    fs.cpSync(source, target, { recursive: true, force: true });
  }
};
const syncSourceForkPackages = () => {
  if (!fs.existsSync(file(".text-to-ui-source-fork.json"))) return;
  const installed = file("node_modules", "@text-to-ui");
  for (const name of fs.readdirSync(file("packages"))) {
    const source = file("packages", name);
    const target = path.join(installed, name);
    if (fs.existsSync(target)) fs.cpSync(source, target, { recursive: true, force: true });
  }
};

if (!command || command === "help") {
  console.log("Usage: text-to-ui <doctor|new-project|fork-source|refresh-index|generate|build|preview> [project] [generator arguments]");
  process.exit(0);
}
const manifest = doctor();
if (command === "doctor") {
  console.log(JSON.stringify({ ok: true, platform: manifest.platform, arch: manifest.arch, node: process.versions.node, components: "bundled", writableSourceFork: fs.existsSync(file(".text-to-ui-source-fork.json")), networkRequired: false }, null, 2));
} else if (command === "new-project") {
  if (!args[0]) throw new Error("new-project requires a project directory");
  const project = path.resolve(args[0]);
  run(file("skill-support/scripts/scaffold-standalone-project.mjs"), ["--project", project, "--repo", repo]);
  copyProjectPackages(project);
} else if (command === "fork-source") {
  if (!args[0]) throw new Error("fork-source requires a destination directory");
  const destination = path.resolve(args[0]);
  if (fs.existsSync(destination) && fs.readdirSync(destination).length) throw new Error("fork-source destination must be empty");
  fs.mkdirSync(destination, { recursive: true });
  for (const name of ["SKILL.md", "agents", "skill-support", "packages", "apps", "tools", "fixtures", "package.json", "pnpm-workspace.yaml", "node_modules", "runtime", "offline-runtime.json", "text-to-ui.sh", "text-to-ui.cmd"]) {
    const source = file(name);
    if (fs.existsSync(source)) fs.cpSync(source, path.join(destination, name), { recursive: true, dereference: true });
  }
  fs.writeFileSync(path.join(destination, ".text-to-ui-source-fork.json"), `${JSON.stringify({ source: repo, originalRegistryDigest: manifest.registryDigest }, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, writableSource: destination, note: "Edit this copy, never the installed Skill; merge reviewed changes into the canonical repository." }, null, 2));
} else if (command === "refresh-index") {
  if (!fs.existsSync(file(".text-to-ui-source-fork.json"))) throw new Error("refresh-index is only allowed in a writable source fork");
  run(file("skill-support/scripts/build-skill-catalog-index.mjs"), ["--repo", repo, "--skill-root", file("skill-support")]);
  run(file("skill-support/scripts/build-navigation-index.mjs"), ["--repo", repo, "--skill-root", file("skill-support")]);
} else if (command === "generate") {
  const forwarded = args.filter((item) => item !== "--repo");
  if (forwarded.length !== args.length || !forwarded.includes("--project")) throw new Error("generate requires --project and does not accept --repo; the bundle owns its repository snapshot");
  const project = path.resolve(forwarded[forwarded.indexOf("--project") + 1]);
  syncSourceForkPackages();
  if (!fs.existsSync(path.join(project, "package.json")) || fs.existsSync(file(".text-to-ui-source-fork.json"))) run(file("skill-support/scripts/scaffold-standalone-project.mjs"), ["--project", project, "--repo", repo]);
  copyProjectPackages(project);
  run(file("skill-support/scripts/generate-compliant-page.mjs"), [...forwarded, "--repo", repo]);
} else if (command === "build" || command === "preview") {
  if (!args[0]) throw new Error(`${command} requires a project directory`);
  const project = path.resolve(args[0]);
  if (fs.existsSync(file(".text-to-ui-source-fork.json"))) run(file("skill-support/scripts/scaffold-standalone-project.mjs"), ["--project", project, "--repo", repo]);
  copyProjectPackages(project);
  run(path.join(project, "node_modules", "vite", "bin", "vite.js"), command === "build" ? ["build"] : ["--host", "127.0.0.1"], project);
} else throw new Error(`Unknown offline command: ${command}`);
