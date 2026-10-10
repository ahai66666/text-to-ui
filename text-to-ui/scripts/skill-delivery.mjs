import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const excluded = new Set(["node_modules", "dist", "outputs", ".git", ".text-to-ui", "__pycache__", ".DS_Store", ".delivery-manifest.json", ".text-to-ui-delivery-manifest.json"]);
export function skillFiles(root, relative = "") {
  return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name)) return [];
    const file = path.join(relative, entry.name);
    return entry.isDirectory() ? skillFiles(root, file) : entry.isFile() ? [file] : [];
  }).sort();
}
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const deliveryManifestFile = target => path.join(target, ".delivery-manifest.json");
function previousManagedFiles(target) {
  const file = deliveryManifestFile(target);
  if (!fs.existsSync(file)) return new Set();
  try {
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    return new Set(Object.keys(manifest.files ?? {}));
  } catch {
    return new Set();
  }
}
function staleManagedFiles(source, target) {
  const current = new Set(skillFiles(source));
  return [...previousManagedFiles(target)].filter(file => !current.has(file) && fs.existsSync(path.join(target, file)));
}
function pruneEmptyParentDirectories(target, directory) {
  const root = path.resolve(target);
  let current = path.resolve(directory);
  while (current !== root && current.startsWith(`${root}${path.sep}`)) {
    try {
      fs.rmdirSync(current);
    } catch (error) {
      if (error.code === "ENOENT") {
        current = path.dirname(current);
        continue;
      }
      if (error.code === "ENOTEMPTY" || error.code === "EEXIST") break;
      throw error;
    }
    current = path.dirname(current);
  }
}
function removeStaleManagedFiles(target, currentFiles, backupRoot) {
  const root = path.resolve(target);
  const backup = path.resolve(backupRoot);
  const current = new Set(Object.keys(currentFiles));
  const stale = [...previousManagedFiles(target)].filter(file => !current.has(file));
  for (const file of stale) {
    const targetFile = path.resolve(root, file);
    if (!targetFile.startsWith(`${root}${path.sep}`)) {
      throw new Error(`Refusing to remove an unsafe managed path: ${file}`);
    }
    let stat;
    try {
      stat = fs.lstatSync(targetFile);
    } catch (error) {
      if (error.code === "ENOENT") {
        pruneEmptyParentDirectories(root, path.dirname(targetFile));
        continue;
      }
      throw error;
    }
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`Refusing to remove a non-regular stale managed file: ${file}`);
    }
    const backupFile = path.resolve(backup, file);
    if (!backupFile.startsWith(`${backup}${path.sep}`)) {
      throw new Error(`Refusing an unsafe delivery backup path: ${file}`);
    }
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    fs.copyFileSync(targetFile, backupFile);
    fs.unlinkSync(targetFile);
    pruneEmptyParentDirectories(root, path.dirname(targetFile));
  }
}
function staleFilesFromManifest(target, manifestFile, currentFiles) {
  if (!fs.existsSync(manifestFile)) return [];
  try {
    const previous = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    const current = new Set(Object.keys(currentFiles));
    return Object.keys(previous.files ?? {}).filter(file => !current.has(file) && fs.existsSync(path.join(target, file)));
  } catch {
    return [];
  }
}
export function deliveryManifest(root) {
  const files = Object.fromEntries(skillFiles(root).map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
  return { schemaVersion: 1, version: JSON.parse(fs.readFileSync(path.join(root, "package.json"))).version, sourceDigest: hash(JSON.stringify(files)), files };
}
export function verifySkill(source, target) {
  const manifest = deliveryManifest(source);
  const failures = [];
  for (const [file, expected] of Object.entries(manifest.files)) {
    const actual = path.join(target, file);
    if (!fs.existsSync(actual) || hash(fs.readFileSync(actual)) !== expected) failures.push(file);
  }
  const stale = staleManagedFiles(source, target);
  if (stale.length) failures.push(...stale.map(file => `${file} (stale managed file)`));
  if (failures.length) throw new Error(`Skill mirror ${target} differs: ${failures.join(", ")}`);
  for (const file of ["scripts/pixso-native-scene-lib.mjs", "scripts/component-mapping-resolver.mjs", "scripts/coremail-semantic-adapter.mjs"]) {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(path.join(target, file)).href)})`], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`Skill entry cannot load: ${target}/${file}\n${result.stderr}`);
  }
  return manifest;
}
export function syncSkill(source, target, backupRoot) {
  const manifest = deliveryManifest(source);
  removeStaleManagedFiles(target, manifest.files, backupRoot);
  syncFiles(source, target, manifest.files, backupRoot);
  fs.writeFileSync(path.join(target, ".delivery-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  verifySkill(source, target);
}
function syncFiles(source, target, files, backupRoot) {
  for (const file of Object.keys(files)) {
    const from = path.join(source, file), to = path.join(target, file);
    if (fs.existsSync(to) && hash(fs.readFileSync(to)) === files[file]) continue;
    if (fs.existsSync(to)) {
      const backup = path.join(backupRoot, file);
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(to, backup);
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const repository = path.dirname(source);
  const targets = [path.join(repository, "skill")];
  const installed = process.env.TEXT_TO_UI_INSTALLED_SKILL_ROOT ?? path.join(os.homedir(), ".codex/skills/text-to-ui");
  if (fs.existsSync(installed) && path.resolve(installed) !== source) targets.push(installed);
  const write = process.argv.includes("--write");
  if (!write && !process.argv.includes("--check")) throw new Error("Use --check or --write");
  const backup = write ? fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-delivery-")) : null;
  for (const [index, target] of targets.entries()) {
    if (write) syncSkill(source, target, path.join(backup, String(index)));
    else verifySkill(source, target);
  }
  const pluginSource = path.join(source, "scripts/pixso-unified-agent-plugin");
  const configuredPluginTarget = process.env.TEXT_TO_UI_UNIFIED_PLUGIN_DELIVERY_ROOT
    ?? process.env.TEXT_TO_UI_PLUGIN_DELIVERY_ROOT
    ?? null;
  const pluginTarget = configuredPluginTarget ? path.resolve(configuredPluginTarget) : null;
  const pluginExists = Boolean(pluginTarget && fs.existsSync(pluginTarget));
  if (pluginExists) {
    const pluginFiles = Object.fromEntries(skillFiles(pluginSource).map(file => [file, hash(fs.readFileSync(path.join(pluginSource, file)))]));
    if (write) syncFiles(pluginSource, pluginTarget, pluginFiles, path.join(backup, "plugin"));
    const pluginManifestPath = path.join(pluginTarget, ".text-to-ui-delivery-manifest.json");
    const stalePluginFiles = staleFilesFromManifest(pluginTarget, pluginManifestPath, pluginFiles);
    if (stalePluginFiles.length) throw new Error(`Plugin delivery has stale managed files: ${stalePluginFiles.join(", ")}`);
    for (const [file, expected] of Object.entries(pluginFiles)) {
      const targetFile = path.join(pluginTarget, file);
      if (!fs.existsSync(targetFile) || hash(fs.readFileSync(targetFile)) !== expected) {
        throw new Error(`Plugin delivery differs: ${targetFile}`);
      }
    }
    if (write) fs.writeFileSync(pluginManifestPath, JSON.stringify({ schemaVersion: 1, sourceDigest: hash(JSON.stringify(pluginFiles)), files: pluginFiles }, null, 2) + "\n");
  }
  console.log(JSON.stringify({ ok: true, targets, pluginTarget: pluginExists ? pluginTarget : null, files: skillFiles(source).length, backup }, null, 2));
}
