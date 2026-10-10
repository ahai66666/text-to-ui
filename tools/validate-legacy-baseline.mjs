#!/usr/bin/env node

import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePreview = path.join(root, "skill-support", "preview");
const sourceDesignTokens = path.join(root, "skill-support", "assets", "design-system");
const targetRoot = path.join(root, "apps", "component-gallery", "public", "legacy-skill");
const manifestPath = path.join(targetRoot, ".baseline-manifest.json");
const failures = [];
const walk = async (directory, prefix = "") => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files;
};
const hashFile = async (file) => crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
try {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const sourceFiles = [
    ...(await walk(sourcePreview)).map((file) => path.join("preview", file)),
    ...(await walk(sourceDesignTokens)).map((file) => path.join("assets", "design-system", file))
  ].sort();
  const expected = Object.fromEntries(sourceFiles.map((file) => [file, null]));
  for (const relative of sourceFiles) expected[relative] = await hashFile(path.join(sourcePreview, relative.replace(/^preview[\\/]/, ""))).catch(async () => hashFile(path.join(sourceDesignTokens, relative.replace(/^assets[\\/]design-system[\\/]/, ""))));
  for (const relative of sourceFiles) {
    const targetHash = await hashFile(path.join(targetRoot, relative)).catch(() => null);
    if (!targetHash || targetHash !== expected[relative] || manifest.files?.[relative] !== targetHash) failures.push(`${relative}: source, target, or manifest hash differs`);
  }
  for (const relative of Object.keys(manifest.files ?? {})) if (!expected[relative]) failures.push(`${relative}: manifest contains an unexpected file`);
} catch (error) {
  failures.push(`baseline manifest unavailable: ${error.message}`);
}
console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
if (failures.length) process.exit(1);
